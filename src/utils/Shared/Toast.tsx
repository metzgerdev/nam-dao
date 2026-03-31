interface ToastProps {
  message: string;
}

function Toast({ message }: ToastProps) {
  return (
    <div className="daw-toast" role="status" aria-live="polite">
      <span className="daw-toast__label">Error</span>
      <span className="daw-toast__message">{message}</span>
    </div>
  );
}

export default Toast;
