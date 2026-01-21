// AI Analysis Loader Controller

const AI_ANALYSIS_STEPS = [
  { text: "Analyzing transcription structure...", progress: 5 },
  { text: "Identifying key client requirements...", progress: 10 },
  { text: "Extracting hidden talent indicators...", progress: 15 },
  { text: "Deep-analyzing communication style preferences...", progress: 20 },
  { text: "Evaluating editor specializations...", progress: 25 },
  { text: "Cross-referencing portfolio experience...", progress: 35 },
  { text: "Analyzing work history patterns...", progress: 45 },
  { text: "Reviewing past client feedback...", progress: 55 },
  { text: "Calculating compatibility scores...", progress: 65 },
  { text: "Ranking best-fit candidates...", progress: 75 },
  { text: "Generating detailed insights...", progress: 85 },
  { text: "Preparing personalized recommendations...", progress: 92 },
  { text: "Finalizing match results...", progress: 97 }
];

class AIAnalysisLoader {
  constructor() {
    this.currentStep = 0;
    this.stepInterval = null;
    this.loaderElement = document.getElementById('aiAnalysisLoader');
    this.textElement = document.getElementById('loaderText');
    this.progressElement = document.getElementById('progressFill');
  }

  start() {
    this.currentStep = 0;
    this.show();
    this.updateStep();
    
    // Update steps every 10-15 seconds to match 2-3 min processing time
    const stepDuration = 12000; // 12 seconds per step
    this.stepInterval = setInterval(() => {
      this.nextStep();
    }, stepDuration);
  }

  show() {
    if (this.loaderElement) {
      this.loaderElement.style.display = 'block';
    }
  }

  hide() {
    if (this.loaderElement) {
      this.loaderElement.style.display = 'none';
    }
    this.stop();
  }

  stop() {
    if (this.stepInterval) {
      clearInterval(this.stepInterval);
      this.stepInterval = null;
    }
  }

  nextStep() {
    this.currentStep++;
    if (this.currentStep >= AI_ANALYSIS_STEPS.length) {
      this.currentStep = AI_ANALYSIS_STEPS.length - 1; // Stay at final step
    }
    this.updateStep();
  }

  updateStep() {
    const step = AI_ANALYSIS_STEPS[this.currentStep];
    
    if (this.textElement) {
      // Fade out, change text, fade in
      this.textElement.style.opacity = '0';
      setTimeout(() => {
        this.textElement.textContent = step.text;
        this.textElement.style.opacity = '1';
      }, 150);
    }
    
    if (this.progressElement) {
      this.progressElement.style.width = step.progress + '%';
    }
  }

  complete() {
    // Jump to final step
    this.currentStep = AI_ANALYSIS_STEPS.length - 1;
    this.updateStep();
    
    // Update to completion
    setTimeout(() => {
      if (this.textElement) {
        this.textElement.textContent = "Analysis complete! ✨";
      }
      if (this.progressElement) {
        this.progressElement.style.width = '100%';
      }
    }, 300);
    
    this.stop();
  }
}

// Global instance
let aiLoader = null;

// Initialize on DOM load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    aiLoader = new AIAnalysisLoader();
  });
} else {
  aiLoader = new AIAnalysisLoader();
}
