// ─── Delete Confirmation Modal ──────────────────────
import Modal from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

export default function DeleteConfirmModal({ open, onClose, onConfirm, title, description }: Props) {
  const handleDelete = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="">
      <div className="delete-confirm">
        <div className="delete-icon">🗑️</div>
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="delete-actions">
          <button className="btn btn-ghost" onClick={onClose}>Hủy</button>
          <button className="btn btn-danger" onClick={handleDelete}>🗑️ Xác nhận xóa</button>
        </div>
      </div>
    </Modal>
  );
}
