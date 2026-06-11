export default function NibLogo({ fill = "#C2683F" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M12 3 L18 12 L12 16 L6 12 Z" fill={fill} />
      <path d="M12 16 V21" stroke={fill} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
