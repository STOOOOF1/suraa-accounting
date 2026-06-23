import TransactionsList from '../components/transactions/TransactionsList';
import { ArrowUpFromLine } from 'lucide-react';

export default function Payments() {
  return (
    <TransactionsList
      type="withdrawal"
      title="سندات الصرف"
      icon={ArrowUpFromLine}
    />
  );
}
