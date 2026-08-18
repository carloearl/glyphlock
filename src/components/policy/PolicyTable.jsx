import React from "react";

export default function PolicyTable({ headers = [], rows = [] }) {
  return (
    <div className="my-5 overflow-x-auto rounded-xl border border-white/15">
      <table className="w-full text-left text-xs md:text-sm">
        <thead>
          <tr className="bg-white/10">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2.5 font-semibold text-white whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 ? "bg-white/[0.03]" : ""}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2.5 align-top text-white/80 border-t border-white/10">
                  {j === 0 ? <span className="font-semibold text-white">{cell}</span> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}