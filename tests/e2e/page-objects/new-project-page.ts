import { Page, expect } from "@playwright/test";
import { ProjectStatus } from "../../../src/types";

export class NewProjectPage {
  readonly page: Page;
  readonly container: string;
  readonly backButton: string;
  readonly title: string;
  readonly form: string;
  readonly nameInput: string;
  readonly descriptionTextarea: string;
  readonly newTechnologyInput: string;
  readonly addTechnologyButton: string;
  readonly statusSelect: string;
  readonly repoUrlInput: string;
  readonly demoUrlInput: string;
  readonly previewUrlInput: string;
  readonly cancelButton: string;
  readonly submitButton: string;

  constructor(page: Page) {
    this.page = page;

    // Selectors using data-testid
    this.container = '[data-testid="new-project-container"]';
    this.backButton = '[data-testid="back-to-projects-button"]';
    this.title = '[data-testid="new-project-title"]';
    this.form = '[data-testid="project-form"]';
    this.nameInput = '[data-testid="project-name-input"]';
    this.descriptionTextarea = '[data-testid="project-description-textarea"]';
    this.newTechnologyInput = '[data-testid="new-technology-input"]';
    this.addTechnologyButton = '[data-testid="add-technology-button"]';
    this.statusSelect = '[data-testid="project-status-select"]';
    this.repoUrlInput = '[data-testid="project-repo-url-input"]';
    this.demoUrlInput = '[data-testid="project-demo-url-input"]';
    this.previewUrlInput = '[data-testid="project-preview-url-input"]';
    this.cancelButton = '[data-testid="cancel-project-button"]';
    this.submitButton = '[data-testid="submit-project-button"]';
  }

  async goto() {
    await this.page.goto("/projects/new"); // Assuming the route for new project
  }

  async isOnPage() {
    await expect(this.page.locator(this.title)).toBeVisible();
    await expect(this.page.locator(this.title)).toHaveText("Dodaj nowy projekt");
  }

  async fillProjectName(name: string) {
    const input = this.page.getByTestId("project-name-input");
    await input.click(); // Focus the input
    await input.fill(name);
    // Wait for the value to be set and React Hook Form to process it
    await expect(input).toHaveValue(name);
    // Wait a bit for React Hook Form to finish processing the onChange event
    await this.page.waitForTimeout(50);
  }

  async fillDescription(description: string) {
    const textarea = this.page.getByTestId("project-description-textarea");
    await textarea.click(); // Focus the textarea
    await textarea.fill(description);
    // Wait for the value to be set and React Hook Form to process it
    await expect(textarea).toHaveValue(description);
    // Wait a bit for React Hook Form to finish processing the onChange event
    await this.page.waitForTimeout(50);
  }

  async addTechnology(technology: string) {
    await this.page.getByTestId("new-technology-input").fill(technology);
    await this.page.getByTestId("add-technology-button").click();
  }

  async selectStatus(status: ProjectStatus) {
    // Map status to Polish label for selection
    const statusLabels = {
      [ProjectStatus.PLANNING]: "Planowanie",
      [ProjectStatus.IN_PROGRESS]: "W trakcie",
      [ProjectStatus.MVP_COMPLETED]: "MVP ukończony",
      [ProjectStatus.FINISHED]: "Zakończony",
    };
    const label = statusLabels[status];
    await this.page.getByTestId("project-status-select").click();
    await this.page.getByRole("option", { name: label }).click();
  }

  async fillRepoUrl(url: string) {
    await this.page.getByTestId("project-repo-url-input").fill(url);
  }

  async fillDemoUrl(url: string) {
    await this.page.getByTestId("project-demo-url-input").fill(url);
  }

  async fillPreviewUrl(url: string) {
    await this.page.getByTestId("project-preview-url-input").fill(url);
  }

  async clickCancel() {
    await this.page.getByTestId("cancel-project-button").click();
  }

  async isSubmitEnabled() {
    return await this.page.getByTestId("submit-project-button").isEnabled();
  }

  async clickBack() {
    await this.page.getByTestId("back-to-projects-button").click();
  }
}
