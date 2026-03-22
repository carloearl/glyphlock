import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const testResults = {
      timestamp: new Date().toISOString(),
      testExecutor: user.email,
      tests: []
    };

    // Test 1: Base44 Auth
    try {
      const authTest = await base44.auth.isAuthenticated();
      testResults.tests.push({
        name: 'Base44 Authentication',
        status: authTest ? 'PASS' : 'FAIL',
        details: { authenticated: authTest, userEmail: user.email }
      });
    } catch (error) {
      testResults.tests.push({
        name: 'Base44 Authentication',
        status: 'FAIL',
        error: error.message
      });
    }

    // Test 2: Entity CRUD Operations
    try {
      const testLog = await base44.entities.SystemAuditLog.create({
        event_type: 'INTEGRATION_TEST',
        description: 'Testing entity create operation',
        actor_email: user.email,
        resource_id: 'test-integration',
        status: 'success'
      });

      const logs = await base44.entities.SystemAuditLog.filter({ 
        event_type: 'INTEGRATION_TEST' 
      });

      await base44.entities.SystemAuditLog.delete(testLog.id);

      testResults.tests.push({
        name: 'Entity CRUD Operations',
        status: 'PASS',
        details: { created: !!testLog.id, retrieved: logs.length > 0, deleted: true }
      });
    } catch (error) {
      testResults.tests.push({
        name: 'Entity CRUD Operations',
        status: 'FAIL',
        error: error.message
      });
    }

    // Test 3: Stripe Connection
    try {
      const balance = await stripe.balance.retrieve();
      const products = await stripe.products.list({ limit: 3 });
      
      testResults.tests.push({
        name: 'Stripe API Connection',
        status: 'PASS',
        details: {
          balanceAvailable: balance.available.length > 0,
          productsCount: products.data.length,
          currency: balance.available[0]?.currency
        }
      });
    } catch (error) {
      testResults.tests.push({
        name: 'Stripe API Connection',
        status: 'FAIL',
        error: error.message
      });
    }

    // Test 4: LLM Integration
    try {
      const llmTest = await base44.integrations.Core.InvokeLLM({
        prompt: 'Respond with exactly: "Integration test successful"'
      });
      
      testResults.tests.push({
        name: 'Core LLM Integration',
        status: llmTest ? 'PASS' : 'FAIL',
        details: { responseReceived: !!llmTest, responseLength: llmTest?.length }
      });
    } catch (error) {
      testResults.tests.push({
        name: 'Core LLM Integration',
        status: 'FAIL',
        error: error.message
      });
    }

    // Test 5: Email Integration
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: 'GlyphLock Integration Test',
        body: 'This is an automated test email. All systems operational.'
      });
      
      testResults.tests.push({
        name: 'Email Integration',
        status: 'PASS',
        details: { sentTo: user.email }
      });
    } catch (error) {
      testResults.tests.push({
        name: 'Email Integration',
        status: 'FAIL',
        error: error.message
      });
    }

    // Test 6: File Upload Integration
    try {
      const testBlob = new Blob(['Test file content'], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt');
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file: testFile });
      
      testResults.tests.push({
        name: 'File Upload Integration',
        status: file_url ? 'PASS' : 'FAIL',
        details: { fileUrl: file_url }
      });
    } catch (error) {
      testResults.tests.push({
        name: 'File Upload Integration',
        status: 'FAIL',
        error: error.message
      });
    }

    // Test 7: Service Role Access
    try {
      const allUsers = await base44.asServiceRole.entities.User.list();
      
      testResults.tests.push({
        name: 'Service Role Access',
        status: 'PASS',
        details: { userCount: allUsers.length }
      });
    } catch (error) {
      testResults.tests.push({
        name: 'Service Role Access',
        status: 'FAIL',
        error: error.message
      });
    }

    // Calculate summary
    const totalTests = testResults.tests.length;
    const passedTests = testResults.tests.filter(t => t.status === 'PASS').length;
    const failedTests = testResults.tests.filter(t => t.status === 'FAIL').length;
    
    testResults.summary = {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate: `${Math.round((passedTests / totalTests) * 100)}%`,
      overallStatus: failedTests === 0 ? 'ALL SYSTEMS OPERATIONAL' : 'ISSUES DETECTED'
    };

    // Log test execution
    await base44.entities.SystemAuditLog.create({
      event_type: 'INTEGRATION_TEST_RUN',
      description: `Integration tests executed: ${passedTests}/${totalTests} passed`,
      actor_email: user.email,
      resource_id: 'backend-tests',
      metadata: testResults.summary,
      status: failedTests === 0 ? 'success' : 'failure'
    });

    return Response.json(testResults);

  } catch (error) {
    console.error('Test Integration Error:', error);
    return Response.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});