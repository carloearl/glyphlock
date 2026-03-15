import BarcodeFirstCapture from "./BarcodeFirstCapture";

export default function HardcopyRescan({ serialNumber, contractId, guestName, onComplete }) {
  return (
    <BarcodeFirstCapture
      contractId={contractId}
      serialNumber={serialNumber}
      guestName={guestName}
      onComplete={onComplete}
    />
  );
}