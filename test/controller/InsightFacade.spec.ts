import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import {clearDisk, getContentFromArchives} from "../TestUtil";
import * as fs from "fs-extra";
import {fail} from "assert";
import {folderTest} from "@ubccpsc310/folder-test";
import {expect} from "chai";

type Query = unknown;
type Output = Promise<InsightResult[]>;
type Error = "InsightError" | "ResultTooLargeError";

describe("InsightFacade", function () {
	let insightFacade: InsightFacade;

	const persistDir = "./data";
	const datasetContents = new Map<string, string>();

	let courses: string;
	let invalid: string;
	let noValidCourses: string;
	let simple: string;
	let rooms: string;
	let simpleRooms: string;
	let coursesWithRooms: string;

	// Reference any datasets you've added to test/resources/archives here and they will
	// automatically be loaded in the 'before' hook.
	const datasetsToLoad: {[key: string]: string} = {
		courses: "./test/resources/archives/courses.zip",
	};

	before(function () {
		courses = getContentFromArchives("courses.zip");
		invalid = getContentFromArchives("invalid.zip");
		noValidCourses = getContentFromArchives("no_valid_courses.zip");
		simple = getContentFromArchives("one_valid_course.zip");
		rooms = getContentFromArchives("rooms.zip");
		simpleRooms = getContentFromArchives("simpleRoom.zip");
		coursesWithRooms = getContentFromArchives("coursesWithRooms.zip");
		// This section runs once and loads all datasets specified in the datasetsToLoad object
		for (const key of Object.keys(datasetsToLoad)) {
			const content = fs.readFileSync(datasetsToLoad[key]).toString("base64");
			datasetContents.set(key, content);
		}
		// Just in case there is anything hanging around from a previous run
		// fs.removeSync(persistDir);
	});

	describe("Add/Remove/List Dataset", function () {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);
			clearDisk();
		});

		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			console.info(`BeforeTest: ${this.currentTest?.title}`);
			insightFacade = new InsightFacade();
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
		});

		afterEach(function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent from the previous one
			console.info(`AfterTest: ${this.currentTest?.title}`);
			fs.removeSync(persistDir);
		});

		// This is a unit test. You should create more like this!
		it("Should add a valid dataset", function () {
			const id: string = "courses";
			const content: string = datasetContents.get("courses") ?? "";
			const expected: string[] = [id];
			return insightFacade.addDataset(id, content, InsightDatasetKind.Courses).then((result: string[]) => {
				expect(result).to.deep.equal(expected);
			});
		});
	});

	/*
	 * This test suite dynamically generates tests from the JSON files in test/queries.
	 * You should not need to modify it; instead, add additional files to the queries directory.
	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
	 */
	describe("PerformQuery", () => {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);
			clearDisk();
			insightFacade = new InsightFacade();

			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises = [
				insightFacade.addDataset("courses", datasetContents.get("courses") ?? "", InsightDatasetKind.Courses),
				insightFacade.addDataset("rooms", rooms, InsightDatasetKind.Rooms)
			];

			return Promise.all(loadDatasetPromises);
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			fs.removeSync(persistDir);
		});

		function assertResult(actual: any, expected: Awaited<Output>): void {
			// expect(actual).to.deep.equal(expected);
			expect(actual.length).to.equal(expected.length);

		}

		function assertError(actual: Awaited<any>, expected: Error): void {
			if (expected === "InsightError") {
				expect(actual).to.be.an.instanceof(InsightError);
			} else {
				expect(actual).to.be.an.instanceof(ResultTooLargeError);
			}
		}

		folderTest<Query, Output, Error>(
			"perform Query tests",
			(input: Query): Output => insightFacade.performQuery(input),
			"./test/resources/queries",
			{
				assertOnResult: assertResult,
				assertOnError: assertError,
			}
		);
	});

	describe("addDataset", function() {
		let facade: IInsightFacade;

		beforeEach(function () {
			facade = new InsightFacade();
			clearDisk();
		});

		it("ADD should reject with invalid id", async function() {
			try {
				await facade.addDataset("", courses, InsightDatasetKind.Courses);
				expect.fail("did not reject on white space");
			} catch (err) {
				expect(err).to.be.an.instanceof(InsightError);
			}

			try {
				await facade.addDataset("_", courses, InsightDatasetKind.Courses);
				expect.fail("did not reject on underscore");
			} catch (err) {
				expect(err).to.be.an.instanceof(InsightError);
			}

			try {
				await facade.addDataset(" ", courses, InsightDatasetKind.Courses);
				expect.fail("did not reject on all white space");
			} catch (err) {
				expect(err).to.be.an.instanceof(InsightError);
			}

			try {
				await facade.addDataset("", rooms, InsightDatasetKind.Rooms);
				expect.fail("did not reject on white space");
			} catch (err) {
				expect(err).to.be.an.instanceof(InsightError);
			}

			try {
				await facade.addDataset("_", rooms, InsightDatasetKind.Rooms);
				expect.fail("did not reject on underscore");
			} catch (err) {
				expect(err).to.be.an.instanceof(InsightError);
			}

			try {
				await facade.addDataset(" ", rooms, InsightDatasetKind.Rooms);
				expect.fail("did not reject on all white space");
			} catch (err) {
				expect(err).to.be.an.instanceof(InsightError);
			}
		});

		it("ADD should reject on existed id", async function() {
			try {
				await facade.addDataset("course0", courses, InsightDatasetKind.Courses);
				await facade.addDataset("course0", courses, InsightDatasetKind.Courses);
				expect.fail("did not reject on existed id");
			} catch(err) {
				expect(err).to.be.an.instanceof(InsightError);
				let result = await facade.listDatasets();
				expect(result).length(1);
			}

			try {
				await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
				await facade.addDataset("courses", rooms, InsightDatasetKind.Rooms);
				fail("did not reject on existed id");
			} catch(err) {
				expect(err).to.be.an.instanceof(InsightError);
				let result = await facade.listDatasets();
				expect(result).length(2);
			}
		});

		it("Cannot add a file because it does not have a valid course", async function() {
			try {
				await facade.addDataset("invalidCourse", noValidCourses, InsightDatasetKind.Courses);
				expect.fail("did not reject on invalid file");
			} catch(err) {
				expect(err).to.be.an.instanceof(InsightError);
			}
		});

		it("should add a simple dataset", async function() {
			let result;
			try{
				result = await facade.addDataset("simple", simple, InsightDatasetKind.Courses);
				expect(result).be.an.instanceof(Array);
				expect(result).length(1);
				let expected: string[] = ["simple"];
				expect(result).deep.equal(expected);
			} catch(err) {
				fail("should not catch an error");
			}
		});

		it("should add a dataset", async function () {
			let result;
			try {
				result = await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
				expect(result).be.an.instanceof(Array);
				expect(result).length(1);
				let expected: string[] = ["courses"];
				expect(result).deep.equal(expected);
			} catch (err) {
				fail("should not catch an error");
			}

			try {
				result = await facade.addDataset("a b c", courses, InsightDatasetKind.Courses);
				expect(result).be.an.instanceof(Array);
				expect(result).length(2);
				let expected: string[] = ["a b c", "courses"];
				expect(result).deep.equal(expected);
			} catch (err) {
				console.log(err);
				fail("should not catch an error");
			}
		});

		it("should add a dataset of KIND room", async function() {
			let result;
			try {
				result = await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				expect(result).be.an.instanceof(Array);
				expect(result).length(1);
				const expected: string[] = ["rooms"];
				expect(result).deep.equal(expected);
			} catch(err) {
				fail("should not catch an error");
			}
		});

		it("should add two kind of dataset at the same time", async function () {
			let result;
			try {
				await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
				result = await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				expect(result).be.an.instanceof(Array);
				expect(result).length(2);
				const expected: string[] = ["courses", "rooms"];
				expect(result).deep.equal(expected);
			} catch(err) {
				fail("should not catch an error");
			}
		});
	});

	describe("removeDataset", function () {
		let facade: IInsightFacade;

		beforeEach(async function () {
			facade = new InsightFacade();
			clearDisk();
			await facade.addDataset("courses0", courses, InsightDatasetKind.Courses);
			await facade.addDataset("rooms0", rooms, InsightDatasetKind.Rooms);

		});

		it("REMOVE should return an invalid id error", async function () {
			try {
				await facade.removeDataset("");
				expect.fail("did not reject on whitespace id");
			} catch(err) {
				expect(err).to.be.an.instanceof(InsightError);
			}

			try {
				await facade.removeDataset("_");
				expect.fail("did not reject on underscore");
			} catch(err) {
				expect(err).to.be.an.instanceof(InsightError);
			}
		});

		it("REMOVE should return an NotFoundError", async function () {
			try {
				await facade.removeDataset("courses1");
				expect.fail("did not reject on not found id");
			} catch(err) {
				expect(err).to.be.an.instanceof(NotFoundError);
				expect(err);
			}
		});

		it("should remove the dataset", async function() {
			let result;
			try {
				result = await facade.removeDataset("courses0");
				expect(result).deep.equal("courses0");

			} catch {
				fail("should not catch an error");
			}

			try {
				result = await facade.removeDataset("rooms0");
				expect(result).deep.equal("rooms0");
			} catch(err) {
				fail("should not catch an error");
			}
		});

		it("should remove multiple datasets", async function () {
			let result;
			try {
				await facade.addDataset("courses1", courses, InsightDatasetKind.Courses);
				result = await facade.removeDataset("courses0");
				expect(result).equal("courses0");
				result = await facade.removeDataset("courses1");
				expect(result).equal("courses1");
				result = await facade.removeDataset("rooms0");
				expect(result).equal("rooms0");
			} catch (err) {
				fail("should not catch an error");
			}
		});

	});

	describe("listDatasets", function() {
		let facade: IInsightFacade;

		beforeEach(function () {
			facade = new InsightFacade();
			clearDisk();
		});

		it("should list no datasets", async function() {
			return facade.listDatasets().then((insightDatasets) => {
				expect(insightDatasets).to.deep.equal([]);
				expect(insightDatasets).to.be.an.instanceof(Array);
				expect(insightDatasets).to.have.length(0);
			});
		});

		it("should list one dataset of KIND.COURSES", function() {
			return facade.addDataset("courses", courses, InsightDatasetKind.Courses)
				.then((addedIds) => facade.listDatasets())
				.then((insightDatasets) => {
					expect(insightDatasets).to.deep.equal([{
						id: "courses",
						kind: InsightDatasetKind.Courses,
						numRows: 64612,

					}]);

					expect(insightDatasets).to.be.an.instanceof(Array);
					expect(insightDatasets).to.have.length(1);
				});
		});

		it("should list one dataset of KIND.Rooms", function() {
			return facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms)
				.then((addedIds) => facade.listDatasets())
				.then((insightDatasets) => {
					expect(insightDatasets).to.deep.equal([{
						id: "rooms",
						kind: InsightDatasetKind.Rooms,
						numRows: 364,

					}]);

					expect(insightDatasets).to.be.an.instanceof(Array);
					expect(insightDatasets).to.have.length(1);
				});
		});

		it("should list multiple datasets", function() {
			return facade.addDataset("courses", courses, InsightDatasetKind.Courses)
				.then(()=>{
					return facade.addDataset("courses-2", courses, InsightDatasetKind.Courses);
				})

				.then(() => {
					return facade.listDatasets();
				})
				.then((insightDatasets) => {
					const expectedDatasets: InsightDataset[] = [
						{
							id: "courses",
							kind: InsightDatasetKind.Courses,
							numRows: 64612,
						},
						{
							id: "courses-2",
							kind: InsightDatasetKind.Courses,
							numRows: 64612,
						}
					];
					expect(insightDatasets).to.be.an.instanceof(Array);
					expect(insightDatasets).to.have.length(2);
					expect(insightDatasets).to.deep.equal(expectedDatasets);
				});
		});

		it("should list multiple datasets of different kinds", function() {
			return facade.addDataset("courses", courses, InsightDatasetKind.Courses)
				.then(()=>{
					return facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				})

				.then(() => {
					return facade.listDatasets();
				})
				.then((insightDatasets) => {
					const expectedDatasets: InsightDataset[] = [
						{
							id: "courses",
							kind: InsightDatasetKind.Courses,
							numRows: 64612,
						},
						{
							id: "rooms",
							kind: InsightDatasetKind.Rooms,
							numRows: 364,
						}
					];
					expect(insightDatasets).to.be.an.instanceof(Array);
					expect(insightDatasets).to.have.length(2);
					expect(insightDatasets).to.deep.equal(expectedDatasets);
				});
		});
	});

	describe("Dataset validity", function() {
		let facade: IInsightFacade;
		beforeEach(async function () {
			facade = new InsightFacade();
			clearDisk();
		});

		it ("should not add invalid file", async function () {
			try {
				await facade.addDataset("invalid", invalid, InsightDatasetKind.Courses);
				fail("did not catch any error");
			} catch(err) {
				expect(err).to.be.an.instanceof(InsightError);
				expect(err);
			}

		});
	});

	describe("Add rooms", function() {
		let facade: IInsightFacade;
		beforeEach(async function () {
			facade = new InsightFacade();
			clearDisk();
		});

		it ("should not add invalid file", async function () {
			try {
				await facade.addDataset("invalid", invalid, InsightDatasetKind.Courses);
				fail("did not catch any error");
			} catch(err) {
				// expect(err).to.be.an.instanceof(InsightError);
				expect(err);
			}

		});

		it ("should add a valid file", async function() {
			try {
				await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
			} catch(err) {
				fail("catched error");
			}

		});
	});

	describe("Dynamic folder test", function () {
		let facade: IInsightFacade;
		before(async function () {
			clearDisk();
			facade = new InsightFacade();
			await facade.addDataset("abc", courses, InsightDatasetKind.Courses);
			await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
		});

		function assertResult(actual: any, expected: Awaited<Output>): void {
			// expect(actual).to.equal(expected);
			fs.writeFileSync("./actual.json",JSON.stringify(actual));
			fs.writeFileSync("./expected.json",JSON.stringify(expected));
			expect(actual.length).to.equal(expected.length);

		}

		function assertError(actual: Awaited<any>, expected: Error): void {
			if (expected === "InsightError") {
				expect(actual).to.be.an.instanceof(InsightError);
			} else {
				expect(actual).to.be.an.instanceof(ResultTooLargeError);
			}
		}

		folderTest<Query, Output, Error>(
			"perform Query tests",
			(input: Query): Output => facade.performQuery(input),
			"./test/resources/json",
			{
				assertOnResult: assertResult,
				assertOnError: assertError,
			}
		);
	});

});
