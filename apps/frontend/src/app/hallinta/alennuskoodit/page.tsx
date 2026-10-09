import { redirect } from 'next/navigation';

// Alennuskoodien hallinta on siirretty kumppaniraporttien yhteyteen (Koodit-välilehti).
// Vanha osoite ohjaa sinne, jotta tallennetut linkit toimivat edelleen.
export default function AlennuskooditPage() {
  redirect('/hallinta/raportit?nakyma=koodit');
}
