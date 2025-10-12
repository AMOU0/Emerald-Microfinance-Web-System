document.addEventListener('mousemove', (e) => {
    // Array of eye/pupil pairs to process
    const eyes = [
        { eye: document.getElementById('eye-left'), pupil: document.getElementById('pupil-left') },
        { eye: document.getElementById('eye-right'), pupil: document.getElementById('pupil-right') }
    ];

    // Max distance the pupil can travel from the center (adjusted for the larger eye size)
    const maxPupilMove = 15; 

    eyes.forEach(pair => {
        const eye = pair.eye;
        const pupil = pair.pupil;

        // 1. Get the center of the 'eye' element relative to the viewport
        const eyeRect = eye.getBoundingClientRect();
        const eyeCenterX = eyeRect.left + eyeRect.width / 2;
        const eyeCenterY = eyeRect.top + eyeRect.height / 2;

        // 2. Get mouse position relative to the eye's center
        const mouseX = e.clientX - eyeCenterX;
        const mouseY = e.clientY - eyeCenterY;

        // 3. Calculate the angle from the eye's center to the mouse (in radians)
        const angle = Math.atan2(mouseY, mouseX);

        // 4. Calculate the distance from the eye center to the cursor
        const distance = Math.hypot(mouseX, mouseY);

        // 5. Determine the pupil movement scale (ensures pupil doesn't leave the eye)
        // If the distance is greater than maxPupilMove, scale is 1 (max movement).
        const scale = Math.min(1, distance / maxPupilMove);

        // 6. Calculate the final X and Y positions for the pupil
        const pupilX = Math.cos(angle) * maxPupilMove * scale;
        const pupilY = Math.sin(angle) * maxPupilMove * scale;

        // 7. Apply the movement using CSS transform (translate)
        pupil.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
    });
});
