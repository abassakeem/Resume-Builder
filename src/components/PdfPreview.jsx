import React, { useState, useCallback } from "react";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import ClassicTemplate from "../templates/ClassicTemplate";
import ModernTemplate from "../templates/ModernTemplate";
import MinimalTemplate from "../templates/MinimalTemplate";
import { Download, Eye } from "lucide-react";

const TEMPLATES = {
  1: ClassicTemplate,
  2: ModernTemplate,
  3: MinimalTemplate,
};

export default function PdfPreview({ data }) {
  const Template = TEMPLATES[data.selectedTemplate] || ClassicTemplate;
  const filename = `${(data.basics?.name || "resume").replace(/\s+/g, "_")}_Resume.pdf`;

  return (
    <div className="flex flex-col h-full">
      {/* Download button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900">
        <div className="flex items-center gap-2 text-slate-400">
          <Eye size={14} />
          <span className="text-xs">Live Preview</span>
        </div>
        <PDFDownloadLink document={<Template data={data} />} fileName={filename}>
          {({ loading }) => (
            <button
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
              disabled={loading}
            >
              <Download size={13} />
              {loading ? "Building PDF..." : "Download PDF"}
            </button>
          )}
        </PDFDownloadLink>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 bg-slate-950">
        <PDFViewer
          style={{ width: "100%", height: "100%", border: "none" }}
          showToolbar={false}
        >
          <Template data={data} />
        </PDFViewer>
      </div>
    </div>
  );
}
