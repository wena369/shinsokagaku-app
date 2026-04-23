import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Capture a DOM element and export it as a high-quality PDF.
 */
export async function generatePDF(elementId: string, fileName: string = 'Shinso_Karte.pdf') {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 3, // High quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Calculate PDF size (A4)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Center on page if shorter than A4
    const yOffset = (pdf.internal.pageSize.getHeight() - pdfHeight) / 2;

    pdf.addImage(imgData, 'PNG', 0, yOffset > 0 ? yOffset : 0, pdfWidth, pdfHeight);

    // Add Copyright Footer (Section 6 rule)
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text('©心相科学協会｜Division Miroku Inc.', pdf.internal.pageSize.getWidth() - 10, pdf.internal.pageSize.getHeight() - 5, { align: 'right' });
    
    pdf.save(fileName);
  } catch (error) {
    console.error('PDF export failed:', error);
  }
}
