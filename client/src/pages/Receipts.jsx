import TransactionsList from '../components/transactions/TransactionsList';
import { ArrowDownFromLine } from 'lucide-react';

export default function Receipts() {
  return (
    <TransactionsList
      type="deposit"
      title="سندات القبض"
      icon={ArrowDownFromLine}
    />
  );
}
