"use client";
import React, { Dispatch, SetStateAction, useRef, useState } from "react";
import Webcam from "react-webcam";
import styles from "./ImageCapture.module.css";
import PdfGenerator from "../PDFDownload/PDFDownload";
import { useRouter, useSearchParams } from "next/navigation";
import { getToken } from "@/app/actions";
import QRCode from "../QRCode/QRCode";
import useIsMobile from "@/app/utils";
import { FileUpload } from "../FileUpload/FileUpload";

const IdentityVerification = () => {
  const isMobileDevice = useIsMobile();
  const webcamRef = useRef<Webcam>(null);
  const [idImage, setIdImage] = useState("");
  const [selfieImage, setSelfieImage] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [showQRCode, setShowQRCode] = React.useState(false);
  const [error, setError] = useState(null);
  const [userVerified, setUserVerified] = useState(false); //change to false
  const [isCameraOn, setIsCameraOn] = useState<boolean | undefined>(undefined);
  const [activeToken, setActiveToken] = useState("");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const verifyToken = React.useCallback(
    async (token: string | null) => {
      const activeToken = await getToken(token as string);
      if (!activeToken) {
        router.push("/404");
      } else if (activeToken[0].product !== "idscan") router.push("/404");
      else {
        setActiveToken(activeToken[0]?.token);
        setUserVerified(true);
      }
    },
    [router]
  );

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
      if (!response.ok) {
        const errorData = await response.json();
        console.log("Verification error:", errorData.message);
        setError(errorData.message);
        setLoading(false);
        return; // Stop execution if the response is not OK
      }
      const data = await response.json();
      setData(data);

      setLoading(false);
      setStep(3);
    } catch (err) {
      setLoading(false);
      console.log("Verification failed:", err);
    }
  };

  const checkCameraStatus = React.useCallback(async () => {
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (cameraStream) {
        setIsCameraOn(true);
      } else {
        setIsCameraOn(false);
      }
    } catch (error) {
      setIsCameraOn(false);
    }
  }, []);

  const captureImage = (setImage: Dispatch<SetStateAction<string>>) => {
    const imageSrc: string = webcamRef.current?.getScreenshot() || "";
    setImage(imageSrc);
    if (imageSrc) setStep(2);
  };

  const handleFileDrop = (files: File[]) => {
    const file = files[0];
    if (!Array.isArray(file)) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdImage(reader.result as string);
        if (reader.result) setStep(2);
      };
      if (file) reader.readAsDataURL(file);
    }
  };
  React.useEffect(() => {
    checkCameraStatus();
    if (!token) {
      router.push("/404");
    } else {
      verifyToken(token);
    }
  }, [checkCameraStatus, token, verifyToken, router]);
  if (error)
    return (
      <div className={styles.errorContainer}>
        <div style={{ marginTop: "50px", color: "red" }}>
          <p style={{ textAlign: "center" }}>
            Some texts in the ID image were unreadable.{" "}
          </p>
          <p style={{ textAlign: "center" }}>
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
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            rowGap: "20px",
            marginTop: "60px",
          }}
        >
          <span
            onClick={() => {
              setSelfieImage("");
              setIdImage("");
              setStep(1);
              setError(null);
              setLoading(false);
              setShowQRCode(false);
            }}
            className={styles.bottomText}
          >
            Try again
          </span>
          {!isMobileDevice && !showQRCode && (
            <span
              className={styles.bottomText}
              onClick={() => {
                setShowQRCode(true);
                setError(null);
                setSelfieImage("");
                setIdImage("");
                setStep(0);
              }}
            >
              {" "}
              Switch to mobile
            </span>
          )}
          {showQRCode && (
            <QRCode
              url={`https://services.idscan.rented123.com/?token=${activeToken}`}
              token={activeToken}
            />
          )}{" "}
        </div>
      </div>
    );
  if (userVerified)
    return (
      <div className={styles.container}>
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
          </div>
        )}

        <div className={styles.stepContainer}>
          {!isMobileDevice && step === 1 && !showQRCode && (
            <span
              className={styles.bottomText}
              onClick={() => {
                setShowQRCode(true);
              }}
            >
              For a better experience switch to your phone
            </span>
          )}
          {step === 1 && !showQRCode && (
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
                Please ensure your ID fills no more than 60% - 70% of the
                capture area
              </span>
              {/* Webcam Capture */}
              {!isMobileDevice ? (
                !isCameraOn ? (
                  <div
                    className={styles.webcam}
                    style={{
                      height: "200px",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {isCameraOn === undefined
                      ? "Loading Camera..."
                      : "⚠️ Camera not detected"}
                  </div>
                ) : (
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className={styles.webcam}
                    imageSmoothing
                  />
                )
              ) : (
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className={styles.webcam}
                  videoConstraints={{
                    facingMode: "environment", // Back camera for mobile and front for laptops
                  }}
                  imageSmoothing
                />
              )}
              <button
                onClick={() => captureImage(setIdImage)}
                className={styles.captureButton}
              >
                Capture ID
              </button>
              <FileUpload
                id="id_upload"
                fieldName=""
                uponFileChange={handleFileDrop}
                supportedFileTypes={".jpg,.png,.pdf"}
                isMultiple={false}
              />
            </div>
          )}
          {showQRCode && (
            <QRCode
              url={`https://services.idscan.rented123.com/?token=${activeToken}`}
              token={activeToken}
            />
          )}{" "}
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
                    videoConstraints={{
                      facingMode: "user", // Use the front camera for selfies
                    }}
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
            style={{ marginTop: "20px" }}
          >
            Start all over
          </span>
        )}
        {step === 3 && (
          <div className={styles.iframeParentContainer}>
            <PdfGenerator
              data={data}
              idImage={idImage}
              activeToken={activeToken}
            />
          </div>
        )}
      </div>
    );
};

export default IdentityVerification;
