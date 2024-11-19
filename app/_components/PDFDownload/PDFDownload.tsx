import React from "react";
import jsPDF from "jspdf";
import useIsMobile, { logoImage } from "@/app/utils";
import styles from "./PDFDownload.module.css";
import Accordion from "../Accordion/Accordion";
import { emailPDF } from "@/app/actions";

const saveToS3 = async (
  PDFfile: Blob,
  verificationPassed: boolean,
  fileName: string
) => {
  try {
    const PDFfileBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(PDFfile);
      reader.onloadend = () => {
        const base64data =
          (typeof reader.result === "string" && reader.result?.split(",")[1]) ||
          ""; // Extract base64 part only
        resolve(base64data);
      };
      reader.onerror = reject;
    });

    const response = await fetch("/api/store-pdf", {
      method: "POST",
      body: JSON.stringify({
        PDFfile: PDFfileBase64,
        fileName,
        verificationPassed,
      }),
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.log({ errorData });

      return "An error occurred";
    }
    const data = await response.json();
    console.log(`File uploaded successfully`);
    return data.location; // This is the S3 URL
  } catch (err) {
    console.error("Error uploading file:", err);
    throw err; // Return the error in case something goes wrong
  }
};

const saves3LinkInWordPress = async (
  PDFfile: Blob,
  verificationPassed: boolean,
  fileName: string,
  last_name: string,
  dob: string
) => {
  // Upload to S3 and wait for the result
  try {
    const s3Url = await saveToS3(PDFfile, verificationPassed, fileName); // This is the S3 URL where the PDF is stored
    const response = await fetch("/api/store-url", {
      method: "POST",
      body: JSON.stringify({
        last_name,
        dob,
        fileName,
        report_url: s3Url,
        verification_status: verificationPassed ? "Verified" : "Unverified",
      }),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json", // Optional: Specify that you expect a JSON response
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error saving report URL:", errorData);
      return "An error occured";
    } else {
      const responseData = await response.json();
      console.log("Report URL saved successfully:", responseData);
      return s3Url;
    }
  } catch (error) {
    console.log(error);
    console.error("Failed to upload PDF:", error);
    return "An error occured";
  }
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
  const [pdfUrl, setPdfUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const isMobileDevice = useIsMobile();
  const verification_status = data.verificationStatus;

  const verificationPassed = !verification_status.toLowerCase().includes("not");
  const generatePDF = async () => {
    setLoading(true);
    const doc = new jsPDF();
    const logo = logoImage;
    // Add logo
    doc.addImage(logo, "PNG", 94, 10, 20, 28); // Adjust position and size for center alignment

    // Add a "button" with text centered inside it
    const buttonX = 70; // X position for the button
    const buttonY = 43; // Y position for the button
    const buttonWidth = 70; // Button width
    const buttonHeight = 10; // Button height
    const rX = 3;
    const rY = 3;

    // Draw button background
    doc.setFillColor("#007bff"); // Blue color
    doc.roundedRect(buttonX, buttonY, buttonWidth, buttonHeight, rX, rY, "F");
    doc.link(buttonX, buttonY, buttonWidth, buttonHeight, {
      url: "https://rented123.com",
    });

    // Add text inside the "button"
    doc.setTextColor("#ffffff"); // White text color
    doc.setFontSize(12);
    doc.text("Membership has its benefits", 105, 49, { align: "center" });

    // Reset font color to black for the rest of the content
    doc.setTextColor("#000000");

    // Format Fields
    doc.setFontSize(12);
    const fields: [string, string, number?][] = [];
    let last_name = "",
      first_name = "",
      dob = "";

    fields.push(["Verification Result", verification_status, 0]);
    fields.push(["Face", idImage, 1]);

    data.aditionalData.filter((item: any) => {
      if (item["name"] === "Surname") {
        fields.push([item.name, item.value, 2]);
        last_name = item.value;
      }
      if (item["name"] === "Given Names") {
        fields.push([item.name, item.value, 3]);
        first_name = item.value;
      }
      if (item["name"] === "Date of Birth") {
        fields.push([item.name, item.value, 4]);
        dob = item.value;
      }
      if (item["name"] === "Age") {
        fields.push([item.name, item.value, 5]);
      }
      if (item["name"] === "Sex") {
        fields.push([item.name, item.value, 6]);
      }
      if (item["name"] === "Nationality") {
        fields.push([item.name, item.value, 7]);
      }
      if (item["name"] === "Document Number") {
        fields.push([item.name, item.value, 8]);
      }
      if (item["name"] === "Authority") {
        fields.push([item.name, item.value, 9]);
      }
      if (item["name"] === "Date of Issue") {
        fields.push([item.name, item.value, 10]);
      }
      if (item["name"] === "Date of Expiry") {
        fields.push([item.name, item.value, 11]);
      }
      if (item["name"] === "Issuing State Code") {
        fields.push([item.name, item.value, 9]);
      }
      if (item["name"] === "Issuing State Name") {
        fields.push([item.name, item.value, 10]);
      }
      return;
    });
    let yPosition = 72; // Starting Y position on the page
    fields
      .sort((a: any, b: any) => a[2] - b[2])
      .forEach((field, index) => {
        if (field[0] === "Face" && index === 1) {
          doc.setFontSize(13);
          doc.setFont("Helvetica", "bold");
          doc.setTextColor("#999999");
          doc.text(`${field[0]}`, 10, yPosition + 14);

          doc.addImage(idImage, "JPEG", 10, yPosition + 17, 70, 50);
          yPosition += 90;
        } else if (field[0] === "Verification Result" && index === 0) {
          const pageWidth = doc.internal.pageSize.getWidth(); // Get the width of the PDF page
          const textWidth = doc.getTextWidth(field[1]); // Get the width of the text
          const xPosition = (pageWidth - textWidth) / 2; // Calculate X position for centering
          doc.setFontSize(20);
          doc.setFont("Helvetica", "bold");
          doc.setTextColor(verificationPassed ? "green" : "red");
          doc.text(
            `Verification Result: ${verificationPassed ? "Passed" : "Failed"}`,
            xPosition + 10,
            yPosition,
            { align: "center" }
          );
        } else {
          // Check if we need a new page after 10 entries (or based on your page layout)
          if (index > 0 && index % 7 === 0) {
            doc.addPage();
            yPosition = 22; // Reset Y position at the top of the new page
          }

          doc.setFontSize(13);
          // Render field name
          doc.setFont("Helvetica", "bold");
          doc.setTextColor("#999999");
          doc.text(`${field[0]}`, 10, yPosition);

          // Render field value
          doc.setTextColor("#000");
          doc.setFont("Helvetica", "normal");
          doc.text(field[1], 10, yPosition + 10);

          // Update Y position for the next entry
          yPosition += 22;
        }
      });
    doc.setProperties({
      title: "ID Verification Result",
      author: "Rented123",
      keywords: `${activeToken} ${last_name} ${dob}`,
    });
    const pdfBlob = doc.output("blob");
    const s3Url = await saves3LinkInWordPress(
      pdfBlob,
      verificationPassed,
      `${last_name}_${dob}_verification_report`,
      last_name,
      dob
    );
    emailPDF({ last_name, first_name, dob });

    const isValidURL = (s3Url: string) => /^https?:\/\/\S+\.\S+/.test(s3Url);
    if (isValidURL(s3Url)) {
      setPdfUrl(s3Url);
    } else {
      setError("Sorry an expected error occured. Please try again");
    }
    setLoading(false);
  };
  if (error) {
    return (
      <div style={{ display: "grid", placeItems: "center", color: "red" }}>
        An error has occurred. Please refresh the page to try again
      </div>
    );
  }
  if (!verificationPassed)
    return (
      <>
        <h3>Sorry, we could not verify your ID</h3>
        <Accordion
          title="Why did my ID verification fail ?"
          content={
            <div>
              <ul>
                <li>
                  The image quality might be poor and we might have missed some
                  details. In this case, using a phone camera might help.
                </li>
                <li>Your ID might be expired or</li>
                <li>It might have failed some security checks</li>
              </ul>
              <p>
                Please ensure you follow all necessary requirements when taking
                photo as shown{" "}
                <a
                  //style={{ color: "red" }}
                  href="https://docs.regulaforensics.com/develop/doc-reader-sdk/overview/image-quality-requirements/"
                  target="_blank"
                >
                  here
                </a>{" "}
              </p>
              <p>
                If you still have issues please{" "}
                <a href="mailto:rob@rented123.com">contact us</a>
              </p>
            </div>
          }
        />
        <button
          className={styles.tryAgainButton}
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </>
    );

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
          <a
            href={pdfUrl}
            target="_blank"
            download="generated_report.pdf"
            style={{
              display: "inline-block",
              marginTop: "10px",
              padding: "10px 20px",
              backgroundColor: "#4caf50",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "5px",
              fontSize: "1rem",
            }}
          >
            Download PDF
          </a>
          <span
            style={{ fontSize: "12px", marginTop: "20px", textAlign: "center" }}
          >
            <p>
              {" "}
              By downloading your report, you agree to us storing your
              information on our systems securely.
            </p>
            <p>
              {" "}
              Please for questions, refer to our{" "}
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
            </p>
          </span>
        </>
      ) : (
        <button
          disabled={loading}
          onClick={generatePDF}
          style={{
            padding: "10px 20px",
            backgroundColor: loading ? "gray" : "#4caf50",
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
          {!loading ? "View Report" : "Generating Report..."}
        </button>
      )}
    </div>
  );
};

export default PdfGenerator;
