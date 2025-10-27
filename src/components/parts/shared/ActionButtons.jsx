import { UserRoundPen, Trash2 } from "lucide-react";

export const ActionButtons = ({ 
  onEdit, 
  onDelete 
}) => {
  return (
    <div className="flex items-center space-x-2">
      {/* Edit Button */}
      <div className="relative inline-block group">
        <button
          onClick={onEdit}
          className="text-red-400 hover:text-red-300 font-medium transition-colors"
        >
          <UserRoundPen size={16} />
        </button>
        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          Edit
        </span>
      </div>

      {/* Delete Button */}
      <div className="relative inline-block group">
        <button
          onClick={onDelete}
          className="text-red-400 hover:text-red-300 font-medium transition-colors"
        >
          <Trash2 size={16} />
        </button>
        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          Delete
        </span>
      </div>
    </div>
  );
};

