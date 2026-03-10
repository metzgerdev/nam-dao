import React, { memo, useEffect, useState } from "react";

const ProgressBar = memo(function ProgressBar({
  steps,
  currentStepRef,
  isPlaying,
}) {
  const [uiStep, setUiStep] = useState(currentStepRef.current ?? 0);

  useEffect(() => {
    setUiStep(currentStepRef.current ?? 0);
  }, [currentStepRef]);

  useEffect(() => {
    function syncStep() {
      const nextStep = currentStepRef.current ?? 0;
      setUiStep((previousStep) => {
        return previousStep === nextStep ? previousStep : nextStep;
      });
      animationFrameId = requestAnimationFrame(syncStep);
    }

    if (!isPlaying) {
      setUiStep(currentStepRef.current ?? 0);
      return undefined;
    }

    let animationFrameId = requestAnimationFrame(syncStep);
    return () => cancelAnimationFrame(animationFrameId);
  }, [currentStepRef, isPlaying]);

  return (
    <div className="row-block progress-block">
      <span className="row-name progress-label">position</span>
      <div className="sequencer-row">
        {steps.map((val, index) => (
          <button
            key={index}
            className={index === uiStep ? "step cell active" : "step cell"}
            type="button"
            disabled={true}
          >
            <span className="step-index">{index + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

export default ProgressBar;
