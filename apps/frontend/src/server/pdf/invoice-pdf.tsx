import path from 'path';
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import { siteConfig } from '@/config/site';

// PNG eikä webp — react-pdf:n kuvadekooderi ei tue webp:iä luotettavasti.
const LOGO_PATH = path.join(process.cwd(), 'public/images/logo/logo.png');

function formatDateFi(date: Date | null): string {
  if (!date) return 'sovitaan erikseen';
  return date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatEuro(value: number): string {
  return value.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#111827' },
  logo: { width: 90, marginBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  companyName: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  muted: { fontSize: 9, color: '#6b7280', marginBottom: 2 },
  rightAlign: { textAlign: 'right' },
  docTitle: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  box: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 20 },
  boxLabel: { fontSize: 8, textTransform: 'uppercase', color: '#6b7280', marginBottom: 4 },
  boxValue: { fontSize: 11, fontWeight: 700, marginBottom: 2 },
  table: { marginBottom: 20 },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 6, marginBottom: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 6 },
  th: { fontSize: 8, textTransform: 'uppercase', color: '#6b7280' },
  colDescription: { flex: 3 },
  colVat: { flex: 1, textAlign: 'right' },
  colAmount: { flex: 1.3, textAlign: 'right' },
  totals: { alignSelf: 'flex-end', width: 200, marginBottom: 24 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalsLabel: { color: '#6b7280' },
  totalsGrandRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 6, marginTop: 2 },
  totalsGrandLabel: { fontWeight: 700 },
  totalsGrandValue: { fontWeight: 700 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  footer: { fontSize: 8, color: '#9ca3af', marginTop: 24 },
});

type InvoicePdfProps = {
  invoiceNumber: number;
  customerName: string;
  customerAddress: string | null;
  customerEmail: string | null;
  description: string;
  amount: number;
  vatRate: number;
  createdAt: Date;
  dueDate: Date | null;
  viitenumero: string;
};

function InvoicePdfDocument(props: InvoicePdfProps) {
  const { invoiceNumber, customerName, customerAddress, customerEmail, description, amount, vatRate, createdAt, dueDate, viitenumero } = props;
  const net = amount / (1 + vatRate);
  const vat = amount - net;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={LOGO_PATH} style={styles.logo} />
            <Text style={styles.companyName}>Muuttokone.fi</Text>
            <Text style={styles.muted}>+358 45 847 0755</Text>
            <Text style={styles.muted}>info@muuttokone.fi</Text>
            <Text style={styles.muted}>Y-tunnus: {siteConfig.businessId}</Text>
          </View>
          <View style={styles.rightAlign}>
            <Text style={styles.docTitle}>Lasku</Text>
            <Text style={styles.muted}>Nro {invoiceNumber}</Text>
            <Text style={styles.muted}>{formatDateFi(createdAt)}</Text>
          </View>
        </View>

        <View style={styles.box}>
          <Text style={styles.boxLabel}>Laskutettava</Text>
          <Text style={styles.boxValue}>{customerName}</Text>
          {customerAddress && <Text style={styles.muted}>{customerAddress}</Text>}
          {customerEmail && <Text style={styles.muted}>{customerEmail}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.colDescription]}>Kuvaus</Text>
            <Text style={[styles.th, styles.colVat]}>ALV</Text>
            <Text style={[styles.th, styles.colAmount]}>Hinta (sis. alv)</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colDescription}>{description}</Text>
            <Text style={styles.colVat}>{vatRate === 0 ? '0 %' : '25,5 %'}</Text>
            <Text style={styles.colAmount}>{formatEuro(amount)} €</Text>
          </View>
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Veroton hinta</Text>
            <Text>{formatEuro(net)} €</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>ALV</Text>
            <Text>{formatEuro(vat)} €</Text>
          </View>
          <View style={styles.totalsGrandRow}>
            <Text style={styles.totalsGrandLabel}>Yhteensä</Text>
            <Text style={styles.totalsGrandValue}>{formatEuro(amount)} €</Text>
          </View>
        </View>

        <View style={styles.box}>
          <Text style={styles.boxLabel}>Maksutiedot</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.totalsLabel}>Saaja</Text>
            <Text style={styles.boxValue}>Muuttokone.fi</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.totalsLabel}>Tilinumero (IBAN)</Text>
            <Text style={styles.boxValue}>{siteConfig.bankAccount}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.totalsLabel}>Viitenumero</Text>
            <Text style={styles.boxValue}>{viitenumero}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.totalsLabel}>Eräpäivä</Text>
            <Text style={styles.boxValue}>{formatDateFi(dueDate)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>Kiitos, että valitsit Muuttokone.fi:n! Maksathan viitenumerolla, jotta maksu kohdistuu oikein.</Text>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(props: InvoicePdfProps): Promise<Buffer> {
  return renderToBuffer(<InvoicePdfDocument {...props} />);
}
