// import { useTransition } from "react";
// import { FileSpreadsheet } from "lucide-react";

// import { Button } from "../../ui/Button";

// import { exportAsCSV, exportAsJSON } from "../../../utils/exportData";

// export function ExportDataButtons({ tableName, data }) {
//   const [isPending, startTransition] = useTransition();

//   const handleExport = (format) => {

//     startTransition(async () => {

//           exportAsCSV(data, tableName);
//     });
//   };

//   return (
//     <div className="flex flex-wrap gap-3">
//       <Button
//         variant="outline"
//         className="h-12"
//         disabled={isPending}
//         onClick={() => handleExport("csv")}
//       >
//         <FileSpreadsheet className="mr-2 size-4" />
//         Export CSV
//       </Button>

//       {/* <Button
//         variant="outline"
//         className="h-12"
//         disabled={isPending}
//         onClick={() => handleExport("json")}
//       >
//         <FileJson className="mr-2 size-4" />
//         Export JSON
//       </Button> */}
//     </div>
//   );
// }
