'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { Download } from 'lucide-react';
import { ReceiptPdfDocument, type ReceiptPdfProps } from '@/lib/pdf/receipt-pdf-document';

// Oma tiedosto, jotta @react-pdf/renderer:in selainpuolen koodi (Blob/URL-rajapinnat)
// voidaan ladata next/dynamic(..., { ssr: false }):lla ReceiptClientistä — se ei toimi
// palvelimen puolella renderöitäessä eikä sitä saa yrittää SSR:ätä.
export default function ReceiptDownloadButton(props: ReceiptPdfProps) {
  return (
    <PDFDownloadLink
      document={<ReceiptPdfDocument {...props} />}
      fileName={`kuitti-${props.receiptNumber}.pdf`}
      className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      {({ loading }) => (
        <>
          <Download className="h-4 w-4" /> {loading ? 'Valmistellaan...' : 'Lataa PDF'}
        </>
      )}
    </PDFDownloadLink>
  );
}
