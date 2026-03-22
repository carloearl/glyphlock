import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * PHASE 1 - OBSERVATION LAYER SCANNER
 * Read-only system state analysis
 */

// Helper to list files recursively
async function getFileTree(path = '.') {
    const files = [];
    try {
        for await (const entry of Deno.readDir(path)) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
            
            const fullPath = `${path}/${entry.name}`;
            if (entry.isDirectory) {
                files.push(...await getFileTree(fullPath));
            } else {
                files.push({
                    path: fullPath,
                    name: entry.name,
                    ext: entry.name.split('.').pop()
                });
            }
        }
    } catch (e) {
        console.error(`Error reading dir ${path}:`, e);
    }
    return files;
}

// Helper to read file content safe
async function readFileSafe(path) {
    try {
        return await Deno.readTextFile(path);
    } catch (e) {
        return "";
    }
}

Deno.serve(async (req) => {
    const startTime = Date.now();
    let scanId = crypto.randomUUID();
    
    try {
        const base44 = createClientFromRequest(req);
        // Auth check - Admin only usually, but for now just authenticated
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. INGESTION (READ-ONLY)
        const allFiles = await getFileTree('.');
        const pageFiles = allFiles.filter(f => f.path.startsWith('./pages') && (f.ext === 'js' || f.ext === 'jsx'));
        const componentFiles = allFiles.filter(f => f.path.startsWith('./components') && (f.ext === 'js' || f.ext === 'jsx'));
        
        // 2. CORE SCAN OPERATIONS
        
        // 2.1 Route Enumeration
        const routes = [];
        const pages = [];
        
        for (const file of pageFiles) {
            const content = await readFileSafe(file.path);
            const pageName = file.name.replace(/\.(js|jsx)$/, '');
            const routePath = pageName === 'Home' ? '/' : `/${pageName}`;
            
            // Analyze Auth & Role
            const isProtected = content.includes('base44.auth.isAuthenticated') || 
                               content.includes('<VerificationGate') ||
                               content.includes('base44.auth.me');
                               
            const roleMatch = content.match(/role\s*={?['"](\w+)['"]}?/i) || 
                             content.match(/requiredRole\s*=\s*['"](\w+)['"]/i);
                             
            const role = roleMatch ? roleMatch[1] : (isProtected ? 'authenticated' : 'public');
            
            // Feature Flag
            const featureMatch = content.match(/featureFlag\s*=\s*['"](\w+)['"]/i);
            const featureFlag = featureMatch ? featureMatch[1] : null;

            routes.push({
                path: routePath,
                route_type: isProtected ? 'protected' : 'public',
                auth_required: isProtected,
                role: role,
                feature_flag: featureFlag,
                status: 'active' // Inferred active if file exists
            });

            pages.push({
                page_name: pageName,
                route_binding: routePath,
                active: true,
                error_state: content.includes('TODO') || content.includes('FIXME')
            });
        }

        // 2.3 Component Registry & Usage
        const components = [];
        const usageMap = new Map(); // Component -> Count

        // Initialize usage map
        componentFiles.forEach(c => usageMap.set(c.name.replace(/\.(js|jsx)$/, ''), 0));

        // Scan pages for usage
        for (const file of pageFiles) {
            const content = await readFileSafe(file.path);
            for (const comp of componentFiles) {
                const compName = comp.name.replace(/\.(js|jsx)$/, '');
                // Simple regex for import or usage
                if (content.includes(compName)) {
                    usageMap.set(compName, (usageMap.get(compName) || 0) + 1);
                }
            }
        }
        
        // Also scan components for usage of other components
        for (const file of componentFiles) {
             const content = await readFileSafe(file.path);
             for (const comp of componentFiles) {
                const compName = comp.name.replace(/\.(js|jsx)$/, '');
                 if (comp.name !== file.name && content.includes(compName)) {
                     usageMap.set(compName, (usageMap.get(compName) || 0) + 1);
                 }
             }
        }

        for (const file of componentFiles) {
            const compName = file.name.replace(/\.(js|jsx)$/, '');
            const usageCount = usageMap.get(compName) || 0;
            
            components.push({
                component_name: compName,
                file_path: file.path,
                usage_count: usageCount,
                orphaned: usageCount === 0
            });
        }

        // 2.5 Feature Audit (Simplified for Phase 1)
        // Check for specific "Declared" features known in the system
        const knownFeatures = [
            'QRGenerator', 'Steganography', 'GlyphBot', 'NUPS', 'SiteBuilder', 'TrustSecurity'
        ];
        
        const features = knownFeatures.map(feat => {
            const relatedFiles = allFiles.filter(f => f.name.includes(feat));
            const implemented = relatedFiles.length > 5 ? 'full' : (relatedFiles.length > 0 ? 'partial' : 'none');
            return {
                feature_name: feat,
                declared: true,
                implemented: implemented,
                used: relatedFiles.some(f => {
                   const name = f.name.replace(/\.(js|jsx)$/, '');
                   return usageMap.get(name) > 0;
                })
            };
        });

        // 3. ARTIFACTS
        const artifacts = {
            routes,
            pages,
            components,
            features,
            meta: {
                timestamp: new Date().toISOString(),
                duration_ms: Date.now() - startTime
            }
        };

        // 4. PERSISTENCE (Entities)
        // We create the ScanRun record
        // Note: In a real "read-only" observation, we might not want to write to DB, 
        // but the spec asks for "Exportable" and "Data Model", implying storage.
        // We will store the summary in SieScanRun and details if needed, 
        // but for efficiency we might just return the artifacts for the UI to display/export.
        // Spec says "Output is exportable".
        
        // Saving the run record
        await base44.entities.SieScanRun.create({
            scan_id: scanId,
            timestamp: new Date().toISOString(),
            duration: (Date.now() - startTime) / 1000,
            success: true,
            error_count: 0,
            artifacts: artifacts
        });

        return Response.json(artifacts);

    } catch (error) {
        return Response.json({ 
            error: error.message, 
            stack: error.stack,
            scan_id: scanId,
            success: false
        }, { status: 500 });
    }
});