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

// Add fonts to jsPDF
//import "jspdf-autotable";

const PdfGenerator = ({
  data,
  idImage,
  activeToken,
}: {
  data: any;
  idImage: string;
  activeToken: string;
}) => {
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

      // Create a new PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Document constants
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      // Define colors
      const primaryColor = [50, 66, 155]; // #32429B in RGB
      const secondaryColor = [0, 123, 255]; // #007BFF in RGB
      const textColor = [51, 51, 51]; // #333333 in RGB
      const lightGrayColor = [153, 153, 153]; // #999999 in RGB
      const successColor = [40, 167, 69]; // #28A745 in RGB
      const dangerColor = [220, 53, 69]; // #DC3545 in RGB

      // Define common text styles
      const addPageHeader = (pageNum: number, totalPages: number) => {
        doc.setFillColor(248, 249, 250); // #F8F9FA
        doc.rect(0, 0, pageWidth, 15, "F");
        doc.setDrawColor(233, 236, 239); // #E9ECEF
        doc.setLineWidth(0.1);
        doc.line(0, 15, pageWidth, 15);

        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFontSize(9);
        doc.text("ID Verification Report", margin, 10);

        // Add date on the right
        const today = new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        const dateText = `Generated: ${today}`;
        const dateWidth = doc.getTextWidth(dateText);
        doc.text(dateText, pageWidth - margin - dateWidth, 10);

        // Add page number
        const pageText = `Page ${pageNum} of ${totalPages}`;
        //const pageWidth = doc.getTextWidth(pageText);
        doc.text(pageText, pageWidth - margin - pageWidth, pageHeight - 10);
      };

      // Add footer with disclaimer and page number
      const addPageFooter = (pageNum: number, totalPages: number) => {
        const footerY = pageHeight - 15;

        doc.setFillColor(248, 249, 250); // #F8F9FA
        doc.rect(0, footerY, pageWidth, 15, "F");
        doc.setDrawColor(233, 236, 239); // #E9ECEF
        doc.setLineWidth(0.1);
        doc.line(0, footerY, pageWidth, footerY);

        doc.setFontSize(8);
        doc.setTextColor(
          lightGrayColor[0],
          lightGrayColor[1],
          lightGrayColor[2]
        );
        const year = new Date().getFullYear();

        doc.text(
          `© ${year} Rented123. All rights reserved.`,
          margin,
          footerY + 5
        );

        // Add page number
        const pageText = `Page ${pageNum} of ${totalPages}`;
        const pageTextWidth = doc.getTextWidth(pageText);
        doc.text(pageText, pageWidth - margin - pageTextWidth, footerY + 5);
      };

      // Create cover page
      const createCoverPage = () => {
        // Logo
        doc.addImage(logoImage, "PNG", (pageWidth - 40) / 2, 30, 40, 56);

        // Title
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        const title = "ID Verification Result";
        const titleWidth = doc.getTextWidth(title);
        doc.text(title, (pageWidth - titleWidth) / 2, 110);

        // Subtitle with verification status
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        if (verificationPassed) {
          doc.setTextColor(successColor[0], successColor[1], successColor[2]);
          const subtitle = "VERIFICATION PASSED";
          const subtitleWidth = doc.getTextWidth(subtitle);
          doc.text(subtitle, (pageWidth - subtitleWidth) / 2, 125);
        } else {
          doc.setTextColor(dangerColor[0], dangerColor[1], dangerColor[2]);
          const subtitle = "VERIFICATION FAILED";
          const subtitleWidth = doc.getTextWidth(subtitle);
          doc.text(subtitle, (pageWidth - subtitleWidth) / 2, 125);
        }

        // Person information
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);

        const name = `${first_name} ${last_name}`;
        const nameWidth = doc.getTextWidth(name);
        doc.text(name, (pageWidth - nameWidth) / 2, 140);

        if (dob) {
          const dobText = `Date of Birth: ${dob}`;
          const dobWidth = doc.getTextWidth(dobText);
          doc.text(dobText, (pageWidth - dobWidth) / 2, 150);
        }

        // Date of report
        const today = new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        doc.setFontSize(10);
        const dateText = `Report generated on ${today}`;
        const dateWidth = doc.getTextWidth(dateText);
        doc.text(dateText, (pageWidth - dateWidth) / 2, 165);

        // Add footer
        addPageFooter(1, 2);
      };

      // Create the data page
      const createDataPage = () => {
        doc.addPage();
        addPageHeader(2, 2);

        let yPosition = 30;

        // Section: Personal Information
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("Personal Information", margin, yPosition - 5);

        yPosition += 10;

        // Personal data table
        const personalData = [
          { label: "Surname", value: last_name },
          { label: "Given Names", value: first_name },
          { label: "Date of Birth", value: dob },
        ];

        if (data?.aditionalData) {
          const fieldMap: Record<string, string> = {
            Age: "Age",
            Sex: "Sex/Gender",
            Address: "Physical Address",
            Nationality: "Nationality",
            "Document Number": "Document Number",
            Authority: "Issuing Authority",
            "Date of Issue": "Date of Issue",
            "Date of Expiry": "Date of Expiry",
            "Issuing State Code": "Issuing State Code",
            "Issuing State Name": "Issuing State/Country",
          };

          for (const item of data.aditionalData) {
            if (fieldMap[item.name] !== undefined && item.value) {
              personalData.push({
                label: fieldMap[item.name],
                value: item.value,
              });
            }
          }
        }

        // Create a table for personal data
        doc.setFontSize(10);

        const cellPadding = 5;
        const columnWidth = contentWidth / 2 - cellPadding;

        // Draw the data
        for (let i = 0; i < personalData.length; i++) {
          const isEven = i % 2 === 0;

          if (isEven && yPosition + 25 > pageHeight - 20) {
            addPageFooter(2, 2);
            doc.addPage();
            yPosition = 30;
            addPageHeader(3, 3);
          }

          if (isEven) {
            // Add light background for even rows
            doc.setFillColor(248, 249, 250); // #F8F9FA
            doc.rect(margin, yPosition, contentWidth, 20, "F");
          }

          // Label
          doc.setFont("helvetica", "bold");
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.text(personalData[i].label, margin + cellPadding, yPosition + 12);

          // Value
          doc.setFont("helvetica", "normal");
          doc.text(
            personalData[i].value,
            margin + contentWidth / 2 + cellPadding,
            yPosition + 12
          );

          yPosition += 20;
        }

        // Section: Verification Details
        yPosition += 10;
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        //doc.text("Verification Details", margin, yPosition - 5);

        yPosition += 15;

        // Verification status
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Verification Status:", margin, yPosition);

        // Status value
        if (verificationPassed) {
          doc.setTextColor(successColor[0], successColor[1], successColor[2]);
          doc.text("PASSED", margin + 50, yPosition);
        } else {
          doc.setTextColor(dangerColor[0], dangerColor[1], dangerColor[2]);
          doc.text("FAILED", margin + 50, yPosition);
        }

        yPosition += 15;

        // Add ID image
        if (idImage) {
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.setFont("helvetica", "bold");
          doc.text("ID Image:", margin, yPosition);

          yPosition += 10;

          // Calculate image dimensions to fit within margins while maintaining aspect ratio
          const imageWidth = contentWidth * 0.7;
          const imageHeight = 70; // Fixed height or calculate based on aspect ratio

          const imageX = margin + (contentWidth - imageWidth) / 2;

          doc.addImage(
            idImage,
            "JPEG",
            imageX,
            yPosition,
            imageWidth,
            imageHeight
          );

          yPosition += imageHeight + 10;
        }

        // Add footer
        addPageFooter(2, 2);
      };

      // Generate the full document
      createCoverPage();
      createDataPage();

      // Set document properties
      doc.setProperties({
        title: "ID Verification Report",
        author: "Rented123",
        keywords: `${activeToken} ${last_name} ${dob}`,
        creator: "Rented123 Verification System",
      });

      // Save and upload the PDF
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
