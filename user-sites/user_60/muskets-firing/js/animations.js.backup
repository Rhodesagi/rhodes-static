/**
 * AnimationSystem - Handles procedural animations for musket reloading
 * 12-step historical loading sequence with visual animations
 */

class AnimationSystem {
    constructor() {
        this.easing = {
            linear: t => t,
            easeInOut: t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t,
            easeOut: t => t*(2-t),
            easeIn: t => t*t
        };
    }
    
    // Create a single animation keyframe
    createKeyframe(duration, callback, easing = 'linear') {
        return {
            duration: duration,
            callback: callback,
            easing: this.easing[easing],
            progress: 0
        };
    }
    
    // 12-step musket reload sequence
    createReloadSequence(musket) {
        const sequence = [];
        const parts = musket.parts;
        
        // Step 1: Half-cock hammer (safety position) - 0.5s
        sequence.push(this.createKeyframe(500, (progress) => {
            // Rotate hammer to half-cock position (about 30 degrees back from full cock)
            const angle = THREE.MathUtils.lerp(0, -Math.PI / 6, progress);
            parts.hammer.rotation.x = angle;
        }, 'easeInOut'));
        
        // Step 2: Open flash pan (frizzen opens) - 0.4s
        sequence.push(this.createKeyframe(400, (progress) => {
            // Rotate frizzen forward to open the pan
            const angle = THREE.MathUtils.lerp(0, -Math.PI / 4, progress);
            parts.frizzen.rotation.x = angle;
        }, 'easeInOut'));
        
        // Step 3: Pour powder from horn into barrel - 1.5s
        sequence.push(this.createKeyframe(1500, (progress) => {
            // Animate powder horn moving to barrel
            const startPos = parts.powderHorn.position.clone();
            const pourPos = new THREE.Vector3(0, 0.3, -0.4);
            
            if (progress < 0.3) {
                // Move to pour position
                const localProgress = progress / 0.3;
                parts.powderHorn.position.lerpVectors(startPos, pourPos, localProgress);
                parts.powderHorn.rotation.z = THREE.MathUtils.lerp(0, -Math.PI / 3, localProgress);
            } else if (progress < 0.7) {
                // Pouring - tilt to pour
                parts.powderHorn.position.copy(pourPos);
                parts.powderHorn.rotation.z = -Math.PI / 3 - Math.sin((progress - 0.3) * 5) * 0.1;
            } else {
                // Return to hip
                const localProgress = (progress - 0.7) / 0.3;
                parts.powderHorn.position.lerpVectors(pourPos, startPos, localProgress);
                parts.powderHorn.rotation.z = THREE.MathUtils.lerp(-Math.PI / 3, 0, localProgress);
            }
        }, 'easeInOut'));
        
        // Step 4: Place paper cartridge into muzzle - 1.0s
        sequence.push(this.createKeyframe(1000, (progress) => {
            // Animate cartridge being placed in muzzle
            if (parts.cartridge) {
                const startPos = new THREE.Vector3(0, 0.2, -0.5);
                const muzzlePos = new THREE.Vector3(0, 0.5, -0.7);
                
                if (progress < 0.5) {
                    parts.cartridge.visible = true;
                    const localProgress = progress / 0.5;
                    parts.cartridge.position.lerpVectors(startPos, muzzlePos, localProgress);
                } else {
                    const localProgress = (progress - 0.5) / 0.5;
                    parts.cartridge.position.y = THREE.MathUtils.lerp(muzzlePos.y, muzzlePos.y - 0.3, localProgress);
                    if (progress > 0.9) parts.cartridge.visible = false;
                }
            }
        }, 'easeInOut'));
        
        // Step 5: Draw ramrod from thimbles - 0.5s
        sequence.push(this.createKeyframe(500, (progress) => {
            // Pull ramrod out and up
            parts.ramrod.position.y = THREE.MathUtils.lerp(-0.3, 0.5, progress);
            parts.ramrod.rotation.z = THREE.MathUtils.lerp(0, -Math.PI / 8, progress);
        }, 'easeOut'));
        
        // Step 6: Ram cartridge down barrel - 2.0s (two solid thrusts)
        sequence.push(this.createKeyframe(2000, (progress) => {
            // Simulate two ramming strokes
            let rammerPos;
            if (progress < 0.5) {
                // First stroke
                const localProgress = progress * 2;
                if (localProgress < 0.3) {
                    // Down
                    const downProgress = localProgress / 0.3;
                    parts.ramrod.position.y = THREE.MathUtils.lerp(0.5, -0.4, downProgress);
                    parts.ramrod.position.z = THREE.MathUtils.lerp(-0.4, -0.55, downProgress);
                } else {
                    // Up
                    const upProgress = (localProgress - 0.3) / 0.7;
                    parts.ramrod.position.y = THREE.MathUtils.lerp(-0.4, 0.4, upProgress);
                    parts.ramrod.position.z = THREE.MathUtils.lerp(-0.55, -0.5, upProgress);
                }
            } else {
                // Second stroke
                const localProgress = (progress - 0.5) * 2;
                if (localProgress < 0.3) {
                    const downProgress = localProgress / 0.3;
                    parts.ramrod.position.y = THREE.MathUtils.lerp(0.4, -0.4, downProgress);
                    parts.ramrod.position.z = THREE.MathUtils.lerp(-0.5, -0.55, downProgress);
                } else {
                    const upProgress = (localProgress - 0.3) / 0.7;
                    parts.ramrod.position.y = THREE.MathUtils.lerp(-0.4, 0.3, upProgress);
                    parts.ramrod.position.z = THREE.MathUtils.lerp(-0.55, -0.5, upProgress);
                }
            }
        }, 'easeInOut'));
        
        // Step 7: Return ramrod to thimbles - 0.8s
        sequence.push(this.createKeyframe(800, (progress) => {
            parts.ramrod.position.y = THREE.MathUtils.lerp(0.3, -0.3, progress);
            parts.ramrod.rotation.z = THREE.MathUtils.lerp(-Math.PI / 8, 0, progress);
        }, 'easeInOut'));
        
        // Step 8: Prime flash pan with powder - 1.5s
        sequence.push(this.createKeyframe(1500, (progress) => {
            // Animate powder into pan
            const startPos = parts.primingFlask.position.clone();
            const panPos = new THREE.Vector3(0.1, 0.25, -0.35);
            
            if (progress < 0.3) {
                const localProgress = progress / 0.3;
                parts.primingFlask.position.lerpVectors(startPos, panPos, localProgress);
                parts.primingFlask.rotation.z = THREE.MathUtils.lerp(0, -Math.PI / 4, localProgress);
            } else if (progress < 0.7) {
                parts.primingFlask.position.copy(panPos);
                parts.primingFlask.rotation.z = -Math.PI / 4 + Math.sin((progress - 0.3) * 6) * 0.05;
                if (parts.flashPan) {
                    parts.flashPan.material.opacity = THREE.MathUtils.lerp(0, 1, (progress - 0.3) / 0.4);
                }
            } else {
                const localProgress = (progress - 0.7) / 0.3;
                parts.primingFlask.position.lerpVectors(panPos, startPos, localProgress);
                parts.primingFlask.rotation.z = THREE.MathUtils.lerp(-Math.PI / 4, 0, localProgress);
            }
        }, 'easeInOut'));
        
        // Step 9: Close frizzen - 0.4s
        sequence.push(this.createKeyframe(400, (progress) => {
            const angle = THREE.MathUtils.lerp(-Math.PI / 4, 0, progress);
            parts.frizzen.rotation.x = angle;
        }, 'easeInOut'));
        
        // Step 10: Cock hammer to full cock - 0.5s
        sequence.push(this.createKeyframe(500, (progress) => {
            const angle = THREE.MathUtils.lerp(-Math.PI / 6, -Math.PI / 2.5, progress);
            parts.hammer.rotation.x = angle;
        }, 'easeInOut'));
        
        // Step 11: Present arms (final ready position) - 0.4s
        sequence.push(this.createKeyframe(400, (progress) => {
            // Return to firing position
            const startRot = musket.mesh.rotation.x;
            const targetRot = 0;
            musket.mesh.rotation.x = THREE.MathUtils.lerp(startRot, targetRot, progress);
        }, 'easeOut'));
        
        return {
            steps: sequence,
            currentStep: 0,
            isComplete: false,
            totalTime: 0
        };
    }
    
    updateSequence(sequence, deltaTime) {
        if (sequence.isComplete) return true;
        
        const currentStep = sequence.steps[sequence.currentStep];
        if (!currentStep) {
            sequence.isComplete = true;
            return true;
        }
        
        sequence.totalTime += deltaTime;
        currentStep.progress += deltaTime;
        
        const stepProgress = Math.min(currentStep.progress / currentStep.duration, 1);
        const easedProgress = currentStep.easing(stepProgress);
        
        currentStep.callback(easedProgress);
        
        if (stepProgress >= 1) {
            sequence.currentStep++;
            if (sequence.currentStep >= sequence.steps.length) {
                sequence.isComplete = true;
                return true;
            }
        }
        
        return false;
    }
}