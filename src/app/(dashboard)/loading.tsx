export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        {/* Modern premium spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-[#3a3330]/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
        <p className="text-sm font-medium text-[#6b6058] animate-pulse font-headings">
          Fetching latest inventory data...
        </p>
      </div>
    </div>
  );
}
