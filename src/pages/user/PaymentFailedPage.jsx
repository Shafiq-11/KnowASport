import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, RefreshCw, Ticket, ArrowRight } from 'lucide-react';
import Button from '../../components/common/Button.jsx';

export default function PaymentFailedPage() {
  const { registrationId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="kas-container py-16 max-w-lg mx-auto text-center space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-4"
      >
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-sm">
          <XCircle size={36} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
          Payment Unsuccessful
        </h1>

        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-sm mx-auto">
          Your payment could not be processed. Your registration details remain saved, but payment is required to confirm your spot.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => navigate(`/payment/${registrationId}`)}
            icon={<RefreshCw size={16} />}
          >
            Retry Payment
          </Button>

          <Button
            variant="outline"
            size="md"
            fullWidth
            onClick={() => navigate('/my-registrations')}
            icon={<Ticket size={16} />}
          >
            My Registrations
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
