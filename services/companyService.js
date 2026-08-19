const companyRepo = require("../repository/companyRepo");

exports.getCompanyProfile = async (userId) => {
  if (!userId) {
    return { success: false, statusCode: 400, message: "User ID is required." };
  }

  let company = await companyRepo.findCompanyByUserId(userId);

  if (!company) {
    company = await companyRepo.createCompany({
      userId,
      companyName: "My Company",
    });
  }

  return {
    success: true,
    statusCode: 200,
    message: "Company profile fetched successfully",
    data: company,
  };
};

exports.updateCompanyProfile = async (userId, updateData) => {
  if (!userId) {
    return { success: false, statusCode: 400, message: "User ID is required." };
  }

  let company = await companyRepo.findCompanyByUserId(userId);

  if (!company) {
    company = await companyRepo.createCompany({
      userId,
      companyName: updateData.companyName || "My Company",
      ...updateData,
    });
    return {
      success: true,
      statusCode: 201,
      message: "Company profile created successfully",
      data: company,
    };
  }

  const updated = await companyRepo.updateCompany(userId, updateData);

  return {
    success: true,
    statusCode: 200,
    message: "Company profile updated successfully",
    data: updated,
  };
};

exports.getAllCompanies = async () => {
  const companies = await companyRepo.getAllCompanies();
  return {
    success: true,
    statusCode: 200,
    message: "All companies fetched successfully",
    data: companies,
  };
};
