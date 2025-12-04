# Implementation Plan

- [x] 1. Implement Missile Class
  - Create Missile class with position, velocity, and dimensions
  - Implement update method to move missile horizontally
  - Implement draw method to render missile on canvas
  - Add isOffScreen method to detect when missile exits canvas
  - Add getBounds method for collision detection
  - _Requirements: 1.1, 1.2, 1.3, 3.1_

- [ ]* 1.1 Write property test for missile horizontal motion
  - **Property 4: Missile horizontal motion**
  - **Validates: Requirements 1.2**

- [ ]* 1.2 Write property test for missile cleanup on exit
  - **Property 5: Missile cleanup on exit**
  - **Validates: Requirements 1.3**

- [ ]* 1.3 Write property test for missile rendering
  - **Property 12: Missile rendering**
  - **Validates: Requirements 3.1**

- [x] 2. Implement Missile Manager
  - Create MissileManager object with missiles array and configuration
  - Implement fire method to create missiles at player position
  - Add cooldown timer tracking and enforcement
  - Implement maximum missile limit checking
  - Add update method to update all active missiles
  - Implement cleanup method to remove off-screen missiles
  - Add canFire method to validate firing conditions
  - Implement getCount method to return active missile count
  - Add reset method to clear all missiles and cooldown
  - _Requirements: 1.1, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 2.1 Write property test for missile creation at player position
  - **Property 1: Missile creation at player position**
  - **Validates: Requirements 1.1**

- [ ]* 2.2 Write property test for cooldown enforcement
  - **Property 2: Cooldown enforcement on firing**
  - **Validates: Requirements 2.1, 2.2**

- [ ]* 2.3 Write property test for maximum missile limit
  - **Property 3: Maximum missile limit**
  - **Validates: Requirements 2.4**

- [ ]* 2.4 Write property test for cooldown countdown
  - **Property 9: Cooldown countdown**
  - **Validates: Requirements 2.1**

- [ ]* 2.5 Write property test for cooldown expiration
  - **Property 10: Cooldown expiration enables firing**
  - **Validates: Requirements 2.3**

- [ ]* 2.6 Write property test for missile limit release
  - **Property 11: Missile limit release**
  - **Validates: Requirements 2.5**

- [x] 3. Implement Collision Detection
  - Add checkCollision method to detect missile-bird intersections
  - Implement collision removal for both missile and bird
  - Create explosion particle effects at collision point
  - Award score bonus when missile hits bird
  - Integrate with existing angry bird system
  - _Requirements: 1.4, 1.5, 1.6_

- [ ]* 3.1 Write property test for missile-bird collision removal
  - **Property 6: Missile-bird collision removal**
  - **Validates: Requirements 1.4**

- [ ]* 3.2 Write property test for collision score bonus
  - **Property 7: Collision score bonus**
  - **Validates: Requirements 1.6**

- [ ]* 3.3 Write property test for collision explosion effect
  - **Property 8: Collision explosion effect**
  - **Validates: Requirements 1.5**

- [x] 4. Integrate Input Handling
  - Add Spacebar key handler for firing missiles
  - Validate game state before allowing fire
  - Call MissileManager.fire with player position
  - Prevent default Spacebar behavior during gameplay
  - _Requirements: 1.1, 2.2_

- [x] 5. Add Visual Feedback UI
  - Display cooldown indicator below player or in HUD
  - Show active missile count in UI
  - Add visual styling for cooldown bar (color coding)
  - Display "READY" indicator when cooldown expires
  - _Requirements: 3.2, 3.5_

- [ ]* 5.1 Write property test for missile count display
  - **Property 13: Missile count display**
  - **Validates: Requirements 3.5**

- [x] 6. Integrate with Game Loop
  - Add MissileManager.update call in game loop
  - Add MissileManager.draw call in rendering pipeline
  - Call collision detection with angry bird
  - Reset missile system on game over
  - Update cooldown with deltaTime
  - _Requirements: 1.2, 1.3, 1.4, 2.1_

- [ ] 7. Add Sound Effects (Optional)
  - Load missile firing sound effect
  - Play sound when missile is fired
  - Integrate with existing AudioManager if available
  - _Requirements: 3.3_

- [x] 8. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise
  - Verify missiles fire correctly with Spacebar
  - Verify cooldown prevents rapid firing
  - Verify missiles hit and remove angry birds
  - Verify score bonus is awarded correctly
  - Verify UI displays cooldown and missile count
  - Test edge cases (max missiles, rapid firing, multiple collisions)
