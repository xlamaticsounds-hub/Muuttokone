export default function DiilitPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Diilit</h1>
      <p className="text-gray-600 dark:text-gray-400">Avoimet ja suljetut kaupat.</p>
      
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm text-gray-500">Ei aktiivisia diilejä.</p>
      </div>
    </div>
  );
}
