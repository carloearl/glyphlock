import React from "react";

export default function ImportantNotice() {
  return (
    <section className="max-w-3xl mx-auto mb-20 md:mb-28 px-4">
      <p className="text-[10px] uppercase tracking-[5px] text-amber-500/70 mb-4 font-medium text-center">Section VI</p>
      <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10 tracking-tight">
        Important Notice
      </h2>

      <div className="border border-amber-600/30 p-6 md:p-10 bg-amber-900/5">
        <p className="text-sm text-slate-300 leading-[1.9] mb-4">
          Verification does not constitute regulatory certification, statutory compliance approval, 
          or legal enforcement authority.
        </p>
        <p className="text-sm text-slate-300 leading-[1.9]">
          All determinations are governed by the Master Covenant framework and limited to the 
          defined engagement scope. No representation is made regarding third-party regulatory standing, 
          and organizations remain solely responsible for their own compliance obligations.
        </p>
      </div>
    </section>
  );
}