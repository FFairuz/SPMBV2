export default function LoadingSpinner({ text = 'Memuat...' }) {
  return (
    <div className="loading-overlay">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  );
}
