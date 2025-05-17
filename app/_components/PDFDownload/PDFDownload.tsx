import React from "react";
import jsPDF from "jspdf";
import useIsMobile, { logoImage } from "@/app/utils";
import styles from "./PDFDownload.module.css";
import Accordion from "../Accordion/Accordion";
import { emailPDF } from "@/app/actions";
import { Download, Mail } from "lucide-react";

const saveToS3 = async (
  PDFfile: Blob,
  verificationPassed: boolean,
  fileName: string
) => {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(PDFfile);
    reader.onloadend = () => {
      const base64data =
        typeof reader.result === "string" ? reader.result.split(",")[1] : "";
      resolve(base64data);
    };
    reader.onerror = reject;
  });

  const response = await fetch("/api/store-pdf", {
    method: "POST",
    body: JSON.stringify({ PDFfile: base64, fileName, verificationPassed }),
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("PDF upload error:", errorData);
    throw new Error("Upload failed");
  }

  const data = await response.json();
  return data.location;
};

const saves3LinkInWordPress = async (
  PDFfile: Blob,
  verificationPassed: boolean,
  fileName: string,
  last_name: string,
  dob: string
) => {
  const s3Url = await saveToS3(PDFfile, verificationPassed, fileName);
  const response = await fetch("/api/store-url", {
    method: "POST",
    body: JSON.stringify({
      last_name,
      dob,
      fileName,
      report_url: s3Url,
      verification_status: "Verified",
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to save report URL");
  }

  return s3Url;
};

const PdfGenerator = ({
  data,
  idImage,
  activeToken,
}: {
  data: any;
  idImage: string;
  activeToken: string;
}) => {
  // ...imports remain unchanged
  const isMobileDevice = useIsMobile();
  const [pdfUrl, setPdfUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [recipientEmail, setRecipientEmail] = React.useState("");
  const [showEmailInput, setShowEmailInput] = React.useState(false);
  const [emailFeedbackMessage, setEmailFeedbackMessage] = React.useState("");

  const verificationPassed =
    data.verificationStatus === "VERIFIED" ||
    (data.textFields &&
      data.expirationDate &&
      data.mrzVerification &&
      data.securityChecks &&
      data.portraitComparison);

  const extractFields = React.useCallback(() => {
    const result = { last_name: "", first_name: "", date_of_birth: "" };
    if (!data?.aditionalData) return result;
    for (const item of data.aditionalData) {
      if (item.name === "Surname") result.last_name = item.value;
      if (item.name === "Given Names") result.first_name = item.value;
      if (item.name === "Date of Birth") result.date_of_birth = item.value;
    }
    return result;
  }, [data]);

  const clearInputs = () => {
    setShowEmailInput(false);
    setRecipientEmail("");
    setEmailFeedbackMessage("");
  };

  const { last_name, first_name, date_of_birth: dob } = extractFields();

  const generatePDF = async () => {
    try {
      setLoading(true);
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.addImage(logoImage, "PNG", 94, 10, 20, 28);

      doc.setFillColor("#007bff");
      doc.roundedRect(70, 43, 70, 10, 3, 3, "F");
      doc.link(70, 43, 70, 10, { url: "https://rented123.com" });
      doc.setTextColor("#ffffff").setFontSize(12);
      doc.text("Membership has its benefits", 105, 49, { align: "center" });

      doc.setTextColor("#000000").setFontSize(12);

      const fieldMap: Record<string, number> = {
        Age: 5,
        Sex: 6,
        Address: 6,
        Nationality: 7,
        "Document Number": 8,
        Authority: 9,
        "Date of Issue": 10,
        "Date of Expiry": 11,
        "Issuing State Code": 9,
        "Issuing State Name": 10,
      };

      const fields: [string, string, number?][] = [
        ["Verification Result", verificationPassed ? "Passed" : "Failed", 0],
        ["Face", idImage, 1],
        ["Surname", last_name, 2],
        ["Given Names", first_name, 3],
        ["Date of Birth", dob, 4],
      ];

      if (data?.aditionalData) {
        for (const item of data.aditionalData) {
          if (fieldMap[item.name] !== undefined && item.value) {
            const label =
              item.name === "Address" ? "Physical Address" : item.name;
            fields.push([label, item.value, fieldMap[item.name]]);
          }
        }
      }

      let yPosition = 72;

      // Top-centered verification result
      const resultText = `Verification Result: ${
        verificationPassed ? "Passed" : "Failed"
      }`;
      const pageWidth = doc.internal.pageSize.getWidth();
      const textWidth = doc.getTextWidth(resultText);
      const centerX = (pageWidth - textWidth) / 2;
      doc
        .setFontSize(20)
        .setFont("Helvetica", "bold")
        .setTextColor(verificationPassed ? "green" : "red")
        .text(resultText, centerX, yPosition);
      yPosition += 18;

      fields
        .sort((a, b) => (a[2] || 99) - (b[2] || 99))
        .forEach(([label, value]) => {
          if (label === "Verification Result") return;

          if (label === "Face") {
            if (yPosition + 70 >= pageHeight) {
              doc.addPage();
              yPosition = 20;
            }
            doc
              .setFontSize(13)
              .setFont("Helvetica", "bold")
              .setTextColor("#999999")
              .text(label, 10, yPosition + 14);
            doc.addImage(value, "JPEG", 10, yPosition + 17, 70, 50);
            yPosition += 90;
          } else {
            if (yPosition + 30 >= pageHeight) {
              doc.addPage();
              yPosition = 20;
            }
            doc
              .setFontSize(13)
              .setFont("Helvetica", "bold")
              .setTextColor("#999999")
              .text(label, 10, yPosition);
            doc
              .setTextColor("#000")
              .setFont("Helvetica", "normal")
              .text(value, 10, yPosition + 10);
            yPosition += 22;
          }
        });

      doc.setProperties({
        title: "ID Verification Result",
        author: "Rented123",
        keywords: `${activeToken} ${last_name} ${dob}`,
      });

      const blob = doc.output("blob");
      const s3Url = await saves3LinkInWordPress(
        blob,
        verificationPassed,
        `${last_name}_${dob}_verification_report`,
        last_name,
        dob
      );

      if (/^https?:\/\/\S+\.\S+/.test(s3Url)) {
        setPdfUrl(s3Url);
      } else throw new Error("Invalid S3 URL");
    } catch (err) {
      setError("Sorry an unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ...Rest of the component (iframe preview, button, email form) remains unchanged

  if (error) {
    return (
      <div style={{ display: "grid", placeItems: "center", color: "red" }}>
        {error}
      </div>
    );
  }

  if (!verificationPassed) {
    return (
      <>
        <h3 style={{ color: "red" }}>Sorry, we could not verify your ID</h3>
        <Accordion
          title="Why did my ID verification fail?"
          content={
            <div>
              <ul>
                <li>Was the ID in good lighting and glare-free?</li>
                <li>Try using your phone camera for better quality.</li>
                <li>The ID might be expired or failed security checks.</li>
              </ul>
              <p className="text-center mt-6 mb-2">
                Still having trouble?{" "}
                <a href="mailto:rob@rented123.com" className="underline">
                  Contact us
                </a>
              </p>
            </div>
          }
        />
        <button className="btn" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </>
    );
  }

  return (
    <div className={styles.iframe_container}>
      {pdfUrl ? (
        <>
          <iframe
            src={pdfUrl}
            width={isMobileDevice ? "80%" : "100%"}
            height={isMobileDevice ? "350px" : "500px"}
            title="Generated PDF"
            style={{ border: "1px solid #ddd", marginTop: "20px" }}
          />
          <div
            style={{
              display: showEmailInput ? "none" : "flex",
              justifyContent: isMobileDevice ? "center" : "center",
              width: "100%",
              gap: "16px",
            }}
          >
            <a
              href={pdfUrl}
              target="_blank"
              download="ID_Scan_Report.pdf"
              style={{
                marginTop: "10px",
                padding: "5px 10px",
                backgroundColor: "#32429b",
                color: "#fff",
                borderRadius: "5px",
                fontSize: "1rem",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <button
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Download size={16} /> Download
              </button>
            </a>
            <button
              style={{
                marginTop: "10px",
                display: "flex",
                padding: "5px 10px",
                backgroundColor: "#32429b",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
                color: "#fff",
                borderRadius: "5px",
                fontSize: "1rem",
              }}
              onClick={() => setShowEmailInput(true)}
            >
              <Mail size={16} /> Email Me
            </button>
          </div>
          {showEmailInput && (
            <form
              style={{
                width: "100%",
              }}
              onSubmit={async (e) => {
                e.preventDefault();
                const response = await emailPDF(
                  { last_name, first_name },
                  pdfUrl,
                  recipientEmail
                );
                if (!response.ok) {
                  setEmailFeedbackMessage(
                    "Could not send email. Please download."
                  );
                } else {
                  setEmailFeedbackMessage("Email Sent!");
                }
                setTimeout(() => clearInputs(), 2500);
              }}
            >
              <input
                type="email"
                required
                placeholder="john.doe@gmail.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  marginTop: "15px",
                  borderRadius: "5px",
                  border: "1px solid black",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "10px",
                }}
              >
                <p
                  style={{
                    color: emailFeedbackMessage.includes("not")
                      ? "red"
                      : "green",
                  }}
                >
                  {emailFeedbackMessage}
                </p>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    disabled={!recipientEmail}
                    type="submit"
                    style={{
                      padding: "6px 10px",
                      backgroundColor: recipientEmail ? "#32429b" : "#eee",
                      color: "#fff",
                      borderRadius: "5px",
                    }}
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    onClick={clearInputs}
                    style={{
                      padding: "6px 10px",
                      backgroundColor: "#32429b",
                      color: "#fff",
                      borderRadius: "5px",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}
          <p
            style={{ fontSize: "12px", marginTop: "40px", textAlign: "center" }}
          >
            By downloading your report, you agree to us storing your information
            securely. Please read our{" "}
            <a
              href="https://dev.rented123.com/wp-content/uploads/2024/11/Rented123.com-privacy-and-data-collection-consent.docx.pdf"
              target="_blank"
            >
              privacy policy
            </a>{" "}
            and the{" "}
            <a
              href="https://dev.rented123.com/wp-content/uploads/2024/11/BC-Real-Estate-Privacy-Consent.pdf"
              target="_blank"
            >
              BC Real Estate privacy policy
            </a>
            .
          </p>
        </>
      ) : (
        <button
          //className="btn"
          disabled={loading}
          onClick={generatePDF}
          style={{
            padding: "10px 20px",
            backgroundColor: loading ? "gray" : "#32429b",
            color: "#fff",
            border: "none",
            marginTop: "10px",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "1rem",
            width: "100%",
            maxWidth: "200px",
          }}
        >
          {loading ? "Generating Report..." : "View Report"}
        </button>
      )}
    </div>
  );
};

export default PdfGenerator;
