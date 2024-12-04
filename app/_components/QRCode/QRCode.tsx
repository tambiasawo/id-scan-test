// Import the QRCode component
import QRCode from "react-qr-code";

const QRCodeDisplay = ({ url, token }: { url: string; token: string }) => {
  return (
    <div
      className="flex flex-col justify-center align-middle items-center gap-2"
    >
      <h3 className="font-bold mb-2">Scan this QR Code</h3>
      <QRCode value={url} size={200} />
      <p>{`https://services.idscan.rented123.com/${token}`}</p>
    </div>
  );
};

export default QRCodeDisplay;
