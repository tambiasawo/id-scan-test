import { emailPDF } from "@/app/actions";
import useIsMobile from "@/app/utils";
import * as React from "react";

export default function FormDialog({
  pdfUrl,
  recipient,
}: {
  pdfUrl: string;
  recipient: { last_name: string; first_name: string };
}) {
  const [recipientEmail, setRecipientEmail] = React.useState("");
  const [showEmailInput, setShowEmailInput] = React.useState(false);
  const [emailFeedbackMessage, setEmailFeedbackMessage] = React.useState("");
  const isMobileDevice = useIsMobile();

  const { last_name, first_name } = recipient;
  const clearInputs = React.useCallback(() => {
    setShowEmailInput(false);
    setRecipientEmail("");
    setEmailFeedbackMessage("");
  }, []);

  return (
    <div>
      <div
        style={{
          display: showEmailInput ? "none" : "flex",
          justifyContent: isMobileDevice ? "center" : "end",
          width: "100%",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <a
          href={pdfUrl}
          target="_blank"
          download="ID Scan_Report.pdf"
          style={{
            marginTop: "10px",
            padding: "5px 10px",
            backgroundColor: "#32429b",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "5px",
            fontSize: "1rem",
          }}
        >
          Download
        </a>
        <button
          style={{
            marginTop: "10px",
            padding: isMobileDevice ? "5px" : "5px 10px",
            width: "100px",
            backgroundColor: "#32429b",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "5px",
            fontSize: "1rem",
          }}
          onClick={() => setShowEmailInput(true)}
        >
          Email Me
        </button>
      </div>
      {showEmailInput && (
        <form
          style={{
            width: "100%",
          }}
          onSubmit={async (e) => {
            e.preventDefault();
            if (!recipientEmail) return;
            const response = await emailPDF(
              {
                last_name,
                first_name,
              },
              pdfUrl,
              recipientEmail
            );
            if (!response.ok) {
              setEmailFeedbackMessage("Could not send email. Please download");
            } else {
              setEmailFeedbackMessage("Email Sent!");
            }
            setTimeout(() => {
              clearInputs();
            }, 2500);
          }}
        >
          <input
            type="email"
            name="email"
            required
            placeholder="john.doe@gmail.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 10px",
              outline: "1px solid #000",
              display: "flex",
              borderRadius: "5px",
              marginTop: "15px",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              //gap: "8px",
              //width: isMobileDevice ? "80%" : "100%",
              alignItems: "center",
            }}
          >
            <p
              style={{
                color: emailFeedbackMessage.includes("not") ? "red" : "green",
                width: "100%",
                visibility: Boolean(emailFeedbackMessage)
                  ? "visible"
                  : "hidden",
              }}
            >
              {emailFeedbackMessage}
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "end",
                float: "right",
              }}
            >
              <button
                style={{
                  padding: "2px 1px",
                  width: "52px",
                  backgroundColor: !recipientEmail ? "#cccccc" : "",
                }}
                type="submit"
                disabled={!Boolean(recipientEmail)}
              >
                Send
              </button>
              <button
                type="button"
                onClick={() => {
                  clearInputs();
                }}
                style={{
                  padding: "2px 5px",
                  width: "62px",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
