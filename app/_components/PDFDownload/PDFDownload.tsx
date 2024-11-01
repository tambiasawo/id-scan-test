import React from "react";
import jsPDF from "jspdf";
import { logoImage } from "@/app/utils";
import styles from "./PDFDownload.module.css";

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
      return;
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
    } else {
      const responseData = await response.json();
      console.log("Report URL saved successfully:", responseData);
      return s3Url;
    }
  } catch (error) {
    console.log(error);
    console.error("Failed to upload PDF:", error);
  }
};

const PdfGenerator = ({ data }: { data: any }) => {
  const [pdfUrl, setPdfUrl] = React.useState("");

  const generatePDF = async () => {
    const doc = new jsPDF();
    const logo = logoImage;
    // Add logo
    doc.addImage(logo, "PNG", 88, 10, 28, 38); // Adjust position and size for center alignment

    // Add a "button" with text centered inside it
    const buttonX = 70; // X position for the button
    const buttonY = 51; // Y position for the button
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
    doc.text("Membership has its benefits", 105, 57, { align: "center" });

    // Reset font color to black for the rest of the content
    doc.setTextColor("#000000");

    // Format Fields
    doc.setFontSize(12);
    const fields: [string, string][] = [];
    let last_name = "",
      dob = "";
    const verification_status = data.verificationStatus;

    const verificationPassed = !verification_status
      .toLowerCase()
      .includes("not");
    fields.push(["Verification Result", verification_status]);
    data.aditionalData.filter((item: any) => {
      if (item["name"] === "Surname") {
        fields.push([item.name, item.value]);
        last_name = item.value;
      }
      if (item["name"] === "Given Names") {
        fields.push([item.name, item.value]);
      }
      if (item["name"] === "Date of Birth") {
        fields.push([item.name, item.value]);
        dob = item.value;
      }
      if (item["name"] === "Age") {
        fields.push([item.name, item.value]);
      }
      if (item["name"] === "Sex") {
        fields.push([item.name, item.value]);
      }
      if (item["name"] === "Nationality") {
        fields.push([item.name, item.value]);
      }
      if (item["name"] === "Document Number") {
        fields.push([item.name, item.value]);
      }
      if (item["name"] === "Authority") {
        fields.push([item.name, item.value]);
      }
      if (item["name"] === "Date of Issue") {
        fields.push([item.name, item.value]);
      }
      if (item["name"] === "Date of Expiry") {
        fields.push([item.name, item.value]);
      }
      if (item["name"] === "Issuing State Code") {
        fields.push([item.name, item.value]);
      }
      if (item["name"] === "Nationality Code") {
        fields.push([item.name, item.value]);
      }
      return;
    });

    fields.forEach((field, index) => {
      doc.setFont("Helvetica", "bold");
      doc.setTextColor("#999999");
      doc.text(`${field[0]}`, 10, 72 + index * 20);
      doc.setTextColor("#000");
      doc.setFont("Helvetica", "normal");
      doc.text(field[1], 10, 82 + index * 20);
    });

    const pdfBlob = doc.output("blob");

    const s3Url = await saves3LinkInWordPress(
      pdfBlob,
      verificationPassed,
      `${last_name}_${dob}_verification_report`,
      last_name,
      dob
    );
    setPdfUrl(s3Url);
  };

  return (
    <div className={styles.iframe_container}>
      {pdfUrl ? (
        <iframe
          src={pdfUrl}
          width="100%"
          height="500px"
          title="Generated PDF"
          style={{ border: "1px solid #ddd", marginTop: "20px" }}
        />
      ) : (
        <button
          onClick={generatePDF}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4caf50",
            color: "#fff",
            border: "none",
            marginTop: "10px",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "1rem",
            width: "100%",
            maxWidth: "200px",
          }}
        >
          View Report
        </button>
      )}
    </div>
  );
};

export default PdfGenerator;
