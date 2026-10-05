import re

with open("C:/Users/DELL/Desktop/my-project_reference_repos/oa-screening/frontend/src/views/DiagnosticReportView.jsx", "r", encoding="utf-8") as f:
    code = f.read()

# Make sure we don't duplicate
if 'import jsPDF' not in code:
    code = code.replace("import React", "import jsPDF from 'jspdf';\nimport 'jspdf-autotable';\nimport React")

pdf_func = """
  const handleDownloadPDF = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor('#064E49');
      doc.text('AYURAGIES CLINICAL REPORT', 20, 20);
      
      doc.setFontSize(12);
      doc.setTextColor('#123B3A');
      doc.text(`Patient ID: ${patient?.id || 'IND-OA-DEMO'}`, 20, 35);
      doc.text(`Name: ${patient?.name || 'Unknown Patient'}`, 20, 42);
      doc.text(`Age/Sex: ${patient?.age || '--'}Y / ${patient?.gender || '--'}`, 20, 49);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 56);
      
      doc.setFontSize(16);
      doc.text('Diagnostic Decision Support', 20, 70);
      doc.setFontSize(11);
      doc.text(`Risk Index: ${reportData?.combinedRisk || 'Moderate Burden'}`, 20, 80);
      doc.text(`Findings: ${reportData?.clinicalNote || 'Clinical signs indicative of functional joint strain.'}`, 20, 87, { maxWidth: 170 });
      
      doc.setFontSize(14);
      doc.text('Recommendation', 20, 110);
      doc.setFontSize(11);
      doc.text('TIER-1 CLINICAL REHABILITATION FOLLOW-UP', 20, 120);
      
      doc.autoTable({
        startY: 130,
        head: [['Metric', 'Value', 'Status']],
        body: [
          ['Stride Length', '1.18 m', 'Normal'],
          ['Cadence', '96 spm', 'Monitor'],
          ['Max Flexion', '134.2 deg', 'Normal']
        ],
        theme: 'grid',
        headStyles: { fillColor: '#064E49' }
      });
      
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text('Medical Disclaimer: This report is generated via the AyurAGIES Clinical Ecosystem. Not a definitive diagnosis.', 20, 280);
      
      doc.save(`AYURAGIES_Clinical_Report_${patient?.id || 'DEMO'}.pdf`);
      setIsGenerating(false);
    }, 1000);
  };
"""

if 'handleDownloadPDF' not in code:
    code = code.replace("const DiagnosticReportView =", pdf_func + "\nconst DiagnosticReportView =")
    
# Replace the old button with the real one
code = re.sub(
    r'<button[^>]*>\s*<span[^>]*>download</span>[^<]*</button>', 
    """<button onClick={handleDownloadPDF} disabled={isGenerating} className="flex items-center gap-xs px-md py-2 rounded-lg bg-primary hover:bg-primary-container text-white transition disabled:opacity-50 font-bold">
        <span className="material-symbols-outlined text-[18px]">download</span>
        {isGenerating ? 'Generating...' : 'Download PDF'}
    </button>""", 
    code
)

if 'const [isGenerating, setIsGenerating] = useState(false);' not in code:
    code = code.replace('const [activeTab, setActiveTab]', 'const [isGenerating, setIsGenerating] = useState(false);\n  const [activeTab, setActiveTab]')

with open("C:/Users/DELL/Desktop/my-project_reference_repos/oa-screening/frontend/src/views/DiagnosticReportView.jsx", "w", encoding="utf-8") as f:
    f.write(code)
print("PDF Export Applied.")
