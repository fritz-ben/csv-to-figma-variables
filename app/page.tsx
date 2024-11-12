import CSVProcessor from "@/components/csv-processor";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 pt-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            CSV to Figma variables 🪄
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Upload your CSV file to generate mode-specific JSON files and
            manifest
          </p>
        </div>
        <CSVProcessor />
      </div>
    </main>
  );
}
