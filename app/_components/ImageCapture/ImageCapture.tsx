"use client";
import React, { Dispatch, SetStateAction, useRef, useState } from "react";
import Webcam from "react-webcam";
import styles from "./ImageCapture.module.css";
import PdfGenerator from "../PDFDownload/PDFDownload";

const IdentityVerification = () => {
  const webcamRef = useRef<Webcam>(null);
  const [idImage, setIdImage] = useState("");
  const [selfieImage, setSelfieImage] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  const handleSubmitVerification = async () => {
    try {
      setError(null);
      setData([]);
      setLoading(true);
      const response = await fetch("/api/verify-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfieImage, idImage }),
      });
      console.log({ selfieImage, idImage });
      if (!response.ok) {
        const errorData = await response.json();
        console.log("Verification error:", errorData.message);
        setError(errorData.message);
        return; // Stop execution if the response is not OK
      }
      const data = await response.json();
      console.log("Verification successful:", data);
      setData(data);
      setLoading(false);
      setStep(3);
    } catch (err) {
      console.log("Verification failed:", err);
      setLoading(false);
    }
  };

  const captureImage = (setImage: Dispatch<SetStateAction<string>>) => {
    const imageSrc: string = webcamRef.current?.getScreenshot() || "";
    setImage(imageSrc);
    setStep(2);
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setIdImage(reader.result as string);
      setStep(2);
    };
    if (file) reader.readAsDataURL(file);
  };

  console.log({ data, error });
  if (error)
    return (
      <div className={styles.errorContainer}>
        <div style={{ marginTop: "50px", color: "red" }}>
          <p>
            The image is unreadable. Please ensure you follow all necessary
            requirements as shown
            <a
              style={{ color: "red" }}
              href="https://docs.regulaforensics.com/develop/doc-reader-sdk/overview/image-quality-requirements/"
            >
              here
            </a>{" "}
          </p>
        </div>
        <span
          onClick={() => {
            setSelfieImage("");
            setIdImage("");
            setStep(1);
            setError(null);
            setLoading(false);
          }}
          className={styles.bottomText}
        >
          Start all over
        </span>
      </div>
    );
  return (
    <div className={styles.container}>
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}

      <div className={styles.stepContainer}>
        {step === 1 && (
          <div className={styles.step}>
            <h2 className={styles.header}>
              Step 1: Capture or Upload ID Document
            </h2>
            <span
              style={{
                fontSize: "13px",
                textAlign: "center",
                marginBottom: "9px",
              }}
            >
              Please ensure your ID fills no more than 70% of the capture area.
              For details, click{" "}
              <a href="https://docs.regulaforensics.com/develop/doc-reader-sdk/overview/image-quality-requirements/">
                here
              </a>
            </span>
            {/* Webcam Capture */}
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className={styles.webcam}
              videoConstraints={{
                facingMode: "environment",
              }}
              imageSmoothing
            />
            <button
              onClick={() => captureImage(setIdImage)}
              className={styles.captureButton}
            >
              Capture ID
            </button>

            {/* Upload Option */}
            <p className={styles.orText}>or</p>
            <div className={styles.uploadContainer}>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className={styles.uploadInput}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.step}>
            <h2 className={styles.header}>Step 2: Capture Selfie</h2>
            {!selfieImage ? (
              <>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className={styles.faceWebcam}
                  imageSmoothing
                />
                <button
                  onClick={() => captureImage(setSelfieImage)}
                  className={styles.captureButton}
                >
                  Capture Selfie
                </button>
              </>
            ) : (
              <img
                src={selfieImage}
                alt="selfie"
                className={styles.faceWebcam}
              />
            )}
          </div>
        )}
      </div>

      {idImage && selfieImage && step === 2 && (
        <button
          onClick={handleSubmitVerification}
          className={styles.submitButton}
        >
          Submit for Verification
        </button>
      )}

      {idImage && step == 2 && (
        <span
          onClick={() => {
            setSelfieImage("");
            setIdImage("");
            setStep(1);
          }}
          className={styles.bottomText}
        >
          Start all over
        </span>
      )}
      {step === 3 && (
        <div className={styles.iframeParentContainer}>
          <PdfGenerator data={data} />
        </div>
      )}
    </div>
  );
};

export default IdentityVerification;
