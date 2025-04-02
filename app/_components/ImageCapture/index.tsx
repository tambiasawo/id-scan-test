"use client";
import React, {
  Dispatch,
  useEffect,
  SetStateAction,
  useRef,
  useState,
} from "react";
import styles from "./ImageCapture.module.css";
import PdfGenerator from "../PDFDownload/PDFDownload";
import { useRouter, useSearchParams } from "next/navigation";
import { getToken } from "@/app/actions";
import QRCode from "../QRCode/QRCode";
import useIsMobile from "@/app/utils";

const IdentityVerification = () => {
  const isMobileDevice = useIsMobile();
  const [idImage, setIdImage] = useState("");
  const [selfieImage, setSelfieImage] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [showQRCode, setShowQRCode] = React.useState(false);
  const [error, setError] = useState<null | string>(null);
  const [isCameraOn, setIsCameraOn] = useState<boolean | undefined>(undefined);
  const [activeToken, setActiveToken] = useState("");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const videoRef = useRef<null | HTMLVideoElement>(null);
  const canvasRef = useRef<null | HTMLCanvasElement>(null);

  const verifyToken = React.useCallback(
    async (token: string | null) => {
      const activeToken = await getToken(token as string);
      if (!activeToken) {
        router.push("/404");
      } else if (activeToken.product !== "idscan") router.push("/404");
      else {
        setActiveToken(activeToken.token);
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

  const checkCameraStatus = async (step: number) => {
    await navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: step > 1 ? "user" : "environment" },
      })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
      })
      .catch(() => setIsCameraOn(false));
  };

  const captureImage = (setImage: Dispatch<SetStateAction<string>>) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      setImage(canvas.toDataURL("image/jpeg"));
      setStep(2);
    }
  };

  useEffect(() => {
    if (!token) {
      router.push("/404");
    } else {
      verifyToken(token);
      checkCameraStatus(step);
    }
  }, [token, verifyToken, router, checkCameraStatus]);

  useEffect(() => {
    checkCameraStatus(step);
  }, [step]);

  if (error)
    return (
      <div className={styles.errorContainer}>
        <div style={{ marginTop: "50px", color: "red" }}>
          <p style={{ textAlign: "center" }}>
            Some texts in the ID image were unreadable.{" "}
          </p>
          <p style={{ textAlign: "center" }}>
            Please ensure you follow all our image requirements when taking a
            photo as shown{" "}
            <a
              href="https://docs.regulaforensics.com/develop/doc-reader-sdk/overview/image-quality-requirements/"
              target="_blank"
              className="underline"
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
            <h2 className={`${styles.header}`}>Step 1: Capture ID Document</h2>
            <span
              style={{
                fontSize: "13px",
                textAlign: "center",
                marginBottom: "9px",
              }}
            >
              Ensure you are in a <strong> well lit</strong> area and there is
              no glare off your ID
            </span>
            {isCameraOn ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={styles.webcam}
                ></video>
                <canvas ref={canvasRef} style={{ display: "none" }}></canvas>{" "}
                <button
                  className="btn"
                  onClick={() => captureImage(setIdImage)}
                >
                  Capture ID
                </button>
                <p className="text-xs mt-2">
                  {" "}
                  If you are not in a <strong>well lit</strong> area, the ID
                  capture won&apos;t work!
                </p>
              </>
            ) : (
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
            )}
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
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={styles.faceWebcam}
                ></video>
                <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

                <button
                  onClick={() => captureImage(setSelfieImage)}
                  className={`btn ${styles.captureButton}`}
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
          className="btn"
          onClick={handleSubmitVerification}
          style={{ marginTop: "15px" }}
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
