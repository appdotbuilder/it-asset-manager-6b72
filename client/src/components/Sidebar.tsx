interface SidebarItem {
  id: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  items: SidebarItem[];
  activeItem: string;
  onItemClick: (itemId: string) => void;
}

export function Sidebar({ items, activeItem, onItemClick }: SidebarProps) {
  return (
    <div className="sidebar">
      {items.map((item: SidebarItem) => (
        <button
          key={item.id}
          className={`sidebar-item ${activeItem === item.id ? 'active' : ''}`}
          onClick={() => onItemClick(item.id)}
        >
          <span className="sidebar-item-icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}