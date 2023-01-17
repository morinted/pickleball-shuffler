export function BadgeGroup({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyItems: "center",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "0.5rem",
      }}
    >
      {" "}
      {children}{" "}
    </div>
  );
}
