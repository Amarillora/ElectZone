function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel' }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">
          <span className="modal-icon-circle">⚠️</span>
        </div>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
        </div>
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        <div className="modal-footer">
          <button onClick={onCancel} className="btn btn-secondary btn-modal">
            {cancelText}
          </button>
          <button onClick={onConfirm} className="btn btn-primary btn-modal">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
