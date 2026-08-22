import React from "react";
import { capabilityRows } from "./providerCapabilities";

export default function ProviderCapabilityMatrix() {
  return (
    <section className="rounded-xl border border-violet-500/25 bg-slate-950/70 p-3">
      <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-violet-200">Source capability truth</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[10px]">
          <thead className="text-slate-500">
            <tr><th className="p-1">Source</th><th>Discover</th><th>Import</th><th>Play</th><th>Mix</th><th>PCM</th><th>Fable sync</th><th>Production</th></tr>
          </thead>
          <tbody>
            {capabilityRows().map((row) => (
              <tr key={row.id} className="border-t border-slate-800 text-slate-300">
                <td className="p-1 font-semibold text-white">{row.label}</td>
                <td>{row.discover ? "Yes" : "No"}</td><td>{row.importPlaylistMetadata ? "Yes" : "No"}</td>
                <td>{row.play ? "Yes" : "No"}</td><td>{row.mixCrossfade ? "Yes" : "No"}</td>
                <td>{row.pcmAnalysis ? "Yes" : "No"}</td><td>{row.fableSync}</td><td>{row.productionAuthorization}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
