"use client";
import React, { Dispatch, SetStateAction, useRef, useState } from "react";
import Webcam from "react-webcam";
import styles from "./ImageCapture.module.css";
import { createReport } from "../actions";

const IdentityVerification = () => {
  const webcamRef = useRef<Webcam>(null);
  const [idImage, setIdImage] = useState("");
  const [selfieImage, setSelfieImage] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmitVerification = async (images: {
    idImage: string;
    selfieImage: string;
  }) => {
    setHasSubmitted(true);
    try {
      setError(null);
      setData([]);
      startLoadingTransition(3, 3500);

      const response = await fetch("/api/verify-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(images),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log("Verification error:", errorData.message);
        setError(errorData.message);
        return; // Stop execution if the response is not OK
      }
      const data = await response.json();
      console.log("Verification successful:", data);
      setData(data);
      createReport(data);
    } catch (err) {
      console.log("Verification failed:", err);
    }
  };

  const captureImage = (setImage: Dispatch<SetStateAction<string>>) => {
    const imageSrc: string = webcamRef.current?.getScreenshot() || "";
    setImage(imageSrc);
    startLoadingTransition(2);
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setIdImage(reader.result as string);
      startLoadingTransition(2);
    };
    if (file) reader.readAsDataURL(file);
  };

  const startLoadingTransition = (step: number, delay?: number) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(step);
    }, delay ?? 1000);
  };

  const submitVerification = () => {
    handleSubmitVerification({ idImage, selfieImage });
  };
  console.log({ data, error });
  if (error)
    return (
      <div>
        An unexpected error occurred. Please ensure the image quality is good
        and try again
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
              Please ensure the corners of your ID touch the edge of the capture
              area
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
        <button onClick={submitVerification} className={styles.submitButton}>
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
        <div style={{ marginTop: "30%" }}>
          <button className={styles.captureButton}>See Result</button>
        </div>
      )}
    </div>
  );
};

export default IdentityVerification;
