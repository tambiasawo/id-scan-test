"use client";
import React, { Dispatch, SetStateAction, useRef, useState } from "react";
import Webcam from "react-webcam";
import styles from "./ImageCapture.module.css";

const IdentityVerification = () => {
  const webcamRef = useRef<Webcam>(null);
  const [idImage, setIdImage] = useState("");
  const [selfieImage, setSelfieImage] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  const handleSubmitVerification = async (images: {
    idImage: string;
    selfieImage: string;
  }) => {
    console.log({ images });

    try {
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
    } catch (err) {
      console.log("Verification failed:", err);
    }
  };

  const captureImage = (setImage: Dispatch<SetStateAction<string>>) => {
    const imageSrc: string = webcamRef.current?.getScreenshot() || "";
    setImage(imageSrc);
    startLoadingTransition();
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setIdImage(reader.result as string);
      startLoadingTransition();
    };
    if (file) reader.readAsDataURL(file);
  };

  const startLoadingTransition = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 2000);
  };

  const submitVerification = () => {
    handleSubmitVerification({ idImage, selfieImage });
  };

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

            {/* Webcam Capture */}
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className={styles.webcam}
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
              <img src={selfieImage} alt="" className={styles.faceWebcam} />
            )}
          </div>
        )}
      </div>

      {idImage && selfieImage && (
        <button onClick={submitVerification} className={styles.submitButton}>
          Submit for Verification
        </button>
      )}

      {selfieImage && idImage && (
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
    </div>
  );
};

export default IdentityVerification;
