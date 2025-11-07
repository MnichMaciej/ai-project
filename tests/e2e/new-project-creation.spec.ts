import { test, expect } from "@playwright/test";
import { NewProjectPage } from "./page-objects/new-project-page";
import { ProjectStatus } from "../../src/types";

test.describe("New Project Creation", () => {
  test("should allow creating a new project by filling all required fields", async ({ page }) => {
    const newProjectPage = new NewProjectPage(page);

    // Arrange: Navigate to the new project page
    await newProjectPage.goto();
    await newProjectPage.isOnPage();

    // Act: Fill all required fields
    await newProjectPage.fillProjectName("Test E2E Project");
    await newProjectPage.fillDescription(
      "This is a test description for E2E testing. It has more than 10 characters to meet the minimum length requirement."
    );
    await newProjectPage.addTechnology("React");
    await newProjectPage.addTechnology("TypeScript");
    await newProjectPage.selectStatus(ProjectStatus.IN_PROGRESS);

    // Optional: Fill URLs for completeness
    await newProjectPage.fillRepoUrl("https://github.com/testuser/test-project");
    await newProjectPage.fillDemoUrl("https://test-project.example.com");
    await newProjectPage.fillPreviewUrl("https://test-project.example.com/preview.png");

    // Assert: Verify the submit button is enabled
    expect(await newProjectPage.isSubmitEnabled()).toBeTruthy();
  });

  test("should show form with submit button disabled on empty fields", async ({ page }) => {
    const newProjectPage = new NewProjectPage(page);

    // Arrange
    await newProjectPage.goto();
    await newProjectPage.isOnPage();

    // Act: Do not fill anything

    // Assert: Submit button should be disabled
    expect(await newProjectPage.isSubmitEnabled()).toBeFalsy();
  });
});
