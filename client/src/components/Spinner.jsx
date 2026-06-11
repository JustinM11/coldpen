// Centered loading spinner. Relies on the global dash-spin keyframes in index.css.
export default function Spinner({ padded = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: padded ? "64px 0" : 0 }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        border: "2px solid var(--line)", borderTopColor: "var(--clay)",
        animation: "dash-spin .8s linear infinite",
      }} />
    </div>
  );
}
