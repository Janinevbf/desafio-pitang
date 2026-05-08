
export function Badge({ children, variant }: any) {
    const styles = variant === "destructive" ? "bg-red-500" : "bg-gray-200";
    return <span className={`px-2 py-1 rounded text-xs ${styles}`}>{children}</span>
}