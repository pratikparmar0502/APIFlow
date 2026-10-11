import toast from 'react-hot-toast';

export const useToast = () => {
  return {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    info: (message: string) =>
      toast(message, {
        icon: 'ℹ️',
        style: {
          background: '#17171B',
          color: '#F5F5F5',
          border: '1px solid #2A2A30',
        },
      }),
    loading: (message: string) => toast.loading(message),
    dismiss: (id?: string) => toast.dismiss(id),
  };
};
