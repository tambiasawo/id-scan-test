// Import the QRCode component
import QRCode from "react-qr-code";

const QRCodeDisplay = ({ url }: { url: string }) => {
  return (
    <div style={{ textAlign: "center", margin: "20px" }}>
      <h3>Scan this QR Code</h3>
      <QRCode value={url} size={200} />
      <p>https://services.idscan.rented123.com</p>
    </div>
  );
};

export default QRCodeDisplay;
