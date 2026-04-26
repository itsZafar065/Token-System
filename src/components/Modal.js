export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto border-t-8 border-brand-purple">
        <div className="p-6 border-b flex justify-between items-center bg-brand-light sticky top-0 z-10">
          <h3 className="font-black text-brand-purple uppercase text-sm">{title}</h3>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-md text-2xl font-bold text-brand-purple">&times;</button>
        </div>
        <div className="p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}