import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat"; 
import { DLToken } from "../typechain-types/DLToken";

describe("Test", function () {
    
    async function deployDLTokenFixture() {
        const DLToken = await ethers.getContractFactory("DLToken");
        const [owner, addr1, addr2] = await ethers.getSigners();
        const dlToken = await DLToken.deploy("DLToken", "DLT");

        await dlToken.waitForDeployment(); 

        return { dlToken, owner, addr1, addr2 };
    }

    describe("Deployment", function () {
        beforeEach(async function () {
            const fixture = await loadFixture(deployDLTokenFixture);
            this.dlToken = fixture.dlToken; 
            this.owner = fixture.owner; 
        });

        it("Should set the correct token name and symbol", async function () {
            const { dlToken } = await loadFixture(deployDLTokenFixture);
            expect(await dlToken.getTokenName()).to.equal("DLToken");
            expect(await dlToken.getSymbol()).to.equal("DLT");
        });

        it("Should set the owner as the deployer", async function () {
            const { dlToken, owner } = await loadFixture(deployDLTokenFixture);
            const totalSupply = await dlToken.getTotalSupply(); 
            expect(await dlToken.balanceOf(owner.address)).to.equal(totalSupply); 
        });
    });

    describe("Token Transfers", function () {
        beforeEach(async function () {
            const fixture = await loadFixture(deployDLTokenFixture);
            this.dlToken = fixture.dlToken; 
            this.owner = fixture.owner; 
            this.addr1 = fixture.addr1; 
            this.addr2 = fixture.addr2; 
        });

        it("Should transfer tokens between accounts", async function () {
            const { owner, dlToken, addr1 } = this; 

            await dlToken.transfer(addr1.address, ethers.parseUnits("100", 18)); 

            const addr1Balance = await dlToken.balanceOf(addr1.address);
            expect(addr1Balance).to.equal(ethers.parseUnits("95", 18)); 

            const ownerBalance = await dlToken.balanceOf(owner.address);
            expect(ownerBalance).to.equal(ethers.parseUnits("999900", 18)); 
        });

        it("Should fail if sender doesn’t have enough tokens", async function () {
            const addr1Balance = await this.dlToken.balanceOf(this.addr1.address);
            expect(addr1Balance).to.equal(ethers.parseUnits("0", 18));

            await expect(
                this.dlToken.connect(this.addr1).transfer(this.addr2.address, ethers.parseUnits("50", 18))
            ).to.be.revertedWith("You can't take more than what is available");
        });

        it("Should correctly burn 5% of tokens during transfer", async function () {
            await this.dlToken.transfer(this.addr1.address, ethers.parseUnits("100", 18));

            const addr1Balance = await this.dlToken.balanceOf(this.addr1.address);
            expect(addr1Balance).to.equal(ethers.parseUnits("95", 18)); 

                  const totalSupply = await this.dlToken.getTotalSupply(); 

            expect(totalSupply).to.equal(ethers.parseUnits("999995", 18)); 
        });
    });

    describe("Allowance and Delegated Transfers", function () {
        beforeEach(async function () {
            const fixture = await loadFixture(deployDLTokenFixture);
            this.dlToken = fixture.dlToken; 
            this.owner = fixture.owner; 
            this.addr1 = fixture.addr1; 
            this.addr2 = fixture.addr2; 
        });

        it("Should approve token allowance", async function () {
            await this.dlToken.approve(this.addr1.address, ethers.parseUnits("200", 18));

            expect(await this.dlToken.allowance(this.owner.address, this.addr1.address)).to.equal(ethers.parseUnits("200", 18));
        });

        it("Should allow transfer of tokens through delegate", async function () {
            await this.dlToken.approve(this.addr1.address, ethers.parseUnits("100", 18));

            await this.dlToken.connect(this.addr1).transferFrom(this.owner.address, this.addr2.address, ethers.parseUnits("100", 18));

            const addr2Balance = await this.dlToken.balanceOf(this.addr2.address);
            expect(addr2Balance).to.equal(ethers.parseUnits("95", 18)); 

            const totalSupply = await this.dlToken.getTotalSupply(); 
            expect(totalSupply).to.equal(ethers.parseUnits("999995", 18)); 
        });

        it("Should not allow transfer exceeding allowance", async function () {
            await this.dlToken.approve(this.addr1.address, ethers.parseUnits("50", 18));

            await expect(
                this.dlToken.connect(this.addr1).transferFrom(this.owner.address, this.addr2.address, ethers.parseUnits("100", 18))
            ).to.be.revertedWith("Allowance exceeded");
        });
    });
});
