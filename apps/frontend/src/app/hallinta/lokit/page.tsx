export default function LokitPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lokit</h1>
      <p className="text-gray-600 dark:text-gray-400">Järjestelmän tapahtumalokit ja historia.</p>
      
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <code className="block whitespace-pre bg-gray-100 p-4 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          [INFO] System started...
          <br />
          [INFO] User logged in...
        </code>
      </div>
    </div>
  );
}
